import { db } from '@/database'
import { usersTable } from '@/drizzle-schema'
import { NotFoundError } from '@/errors/app-error'
import { checkTokenExists } from '@/middlewares/check-session'
import { takeUniqueOrThrow } from '@/utils/drizzle-utils'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const userRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['users'],
        response: {
          200: z.object({
            users: z.array(userResponseSchema),
          }),
        },
      },
    },

    async (_request, reply) => {
      const users = await db.select().from(usersTable)
      return reply.status(200).send({ users })
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
      const user = await db
        .select()
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
      schema: {
        tags: ['users'],
        body: z.object({
          name: z.string(),
          email: z.email(),
        }),
        response: {
          201: z.object({
            user: userResponseSchema,
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email } = request.body

      const userAlreadyExists = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))

      if (userAlreadyExists.length > 0) {
        return reply.status(400).send({ message: 'User already exists' })
      }

      const [user] = await db
        .insert(usersTable)
        .values({ name, email })
        .returning()

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
        }),
        response: {
          200: z.object({
            user: userResponseSchema,
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const getUserRequestParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getUserRequestParamsSchema.parse(request.params)

      const updateUserBodySchema = z.object({
        name: z.string().optional(),
        email: z.email().optional(),
      })

      const { name, email } = updateUserBodySchema.parse(request.body)

      const [user] = await db
        .update(usersTable)
        .set({ name, email })
        .where(eq(usersTable.id, id))
        .returning()

      if (!user) {
        throw new NotFoundError('User not found')
      }

      return reply.status(200).send({ user })
    },
  )
}

export default userRoutes
