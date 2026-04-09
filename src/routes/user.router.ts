import { db } from '@/database'
import { usersTable } from '@/drizzle-schema'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/errors/app-error'
import { checkTokenExists } from '@/middlewares/check-session'
import { hashPassword } from '@/utils/password'
import { takeUniqueOrThrow } from '@/utils/drizzle-utils'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const userRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/me',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['users'],
        response: {
          200: z.object({
            user: userResponseSchema,
          }),
        },
      },
    },

    async (request, reply) => {
      const user = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(eq(usersTable.id, request.userId!))
        .then(takeUniqueOrThrow('User not found'))

      return reply.status(200).send({ user })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['users'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            user: userResponseSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const getUserParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getUserParamsSchema.parse(request.params)

      if (id !== request.userId) {
        throw new ForbiddenError('Cannot access this user')
      }

      const user = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .then(takeUniqueOrThrow('User not found'))

      return reply.status(200).send({
        user,
      })
    },
  )

  app.post(
    '/',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '15 minutes',
        },
      },
      schema: {
        tags: ['users'],
        body: z.object({
          name: z.string(),
          email: z.email(),
          password: passwordSchema,
        }),
        response: {
          201: z.object({
            user: userResponseSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body

      const userAlreadyExists = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))

      if (userAlreadyExists.length > 0) {
        throw new ConflictError('User already exists')
      }

      const hashedPassword = await hashPassword(password)

      const [user] = await db
        .insert(usersTable)
        .values({ name, email, password: hashedPassword })
        .returning({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      return reply.status(201).send({ user })
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['users'],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().optional(),
          email: z.email().optional(),
          password: passwordSchema.optional(),
        }),
        response: {
          200: z.object({
            user: userResponseSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const getUserRequestParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getUserRequestParamsSchema.parse(request.params)

      if (id !== request.userId) {
        throw new ForbiddenError('Cannot update this user')
      }

      const updateUserBodySchema = z.object({
        name: z.string().optional(),
        email: z.email().optional(),
        password: passwordSchema.optional(),
      })

      const { name, email, password } = updateUserBodySchema.parse(request.body)

      const hashedPassword = password ? await hashPassword(password) : undefined

      const [user] = await db
        .update(usersTable)
        .set({
          name,
          email,
          ...(hashedPassword && { password: hashedPassword }),
        })
        .where(eq(usersTable.id, id))
        .returning({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      return reply.status(200).send({ user })
    },
  )
  app.delete(
    '/:id',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['users'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          204: z.object({}),
        },
      },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params)

      if (id !== request.userId) {
        throw new ForbiddenError('Cannot delete this user')
      }

      const deleted = await db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .returning({ id: usersTable.id })

      if (!deleted.length) {
        throw new NotFoundError('User not found')
      }

      reply.clearCookie('token', { path: '/' })
      return reply.status(204).send({})
    },
  )
}

export default userRoutes
