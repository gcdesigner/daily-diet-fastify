import { db } from '@/database'
import { usersTable, type User } from '@/drizzle-schema'
import { checkTokenExists } from '@/middlewares/check-session'
import { takeUniqueOrThrow } from '@/utils/drizzle-utils'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const userRoutes = async (app: FastifyInstance) => {
  app.get(
    '/',
    { preHandler: [checkTokenExists] },
    async (_, reply): Promise<{ users: User[] }> => {
      const users = await db.select().from(usersTable)
      return reply.status(200).send({ users })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkTokenExists] },
    async (request, reply): Promise<{ user: User }> => {
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

  app.post('/', async (request, reply): Promise<{ user: User }> => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.email(),
    })

    const { name, email } = createUserBodySchema.parse(request.body)

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

    return reply.status(201).send({ user })
  })

  app.put(
    '/:id',
    { preHandler: [checkTokenExists] },
    async (request, reply): Promise<{ user: User }> => {
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

      return reply.status(200).send({ user })
    },
  )
}

export default userRoutes
