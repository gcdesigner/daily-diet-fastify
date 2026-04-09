import { db } from '@/database'
import { sessionsTable, usersTable } from '@/drizzle-schema'
import { checkTokenExists } from '@/middlewares/check-session'
import { takeUniqueOrThrow } from '@/utils/drizzle-utils'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const authRoutes = async (app: FastifyInstance) => {
  app.post('/sign-in', async (request, reply) => {
    const signInBodySchema = z.object({
      email: z.email(),
    })

    const { email } = signInBodySchema.parse(request.body)

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then(takeUniqueOrThrow('User not found'))

    const token = randomUUID()
    const expiresAt = new Date(
      Date.now() + 60 * 60 * 24 * 7 * 1000,
    ).toISOString() // 7 days

    await db.insert(sessionsTable).values({
      userId: user.id,
      token,
      expiresAt,
    })

    reply.setCookie('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days,
      httpOnly: true, // impede acesso via Javascript no browser
      sameSite: 'lax', // protecao conta csrf
    })

    return reply.status(200).send({ user })
  })

  app.post(
    '/sign-out',
    { preHandler: [checkTokenExists] },
    async (request, reply) => {
      const token = request.cookies.token!
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token))

      reply.clearCookie('token')

      return reply.status(200).send({ message: 'Signed out' })
    },
  )
}

export default authRoutes
