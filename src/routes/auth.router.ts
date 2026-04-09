import { env } from '@/env'
import { db } from '@/database'
import { sessionsTable, usersTable } from '@/drizzle-schema'
import { checkTokenExists } from '@/middlewares/check-session'
import { hashSessionToken } from '@/utils/session-token'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const cookieOpts = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
}

const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sign-in',
    {
      config: {
        rateLimit: {
          max: 15,
          timeWindow: '15 minutes',
        },
      },
      schema: {
        tags: ['auth'],
        body: z.object({
          email: z.email(),
        }),
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
            }),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const signInBodySchema = z.object({
        email: z.email(),
      })

      const { email } = signInBodySchema.parse(request.body)

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const token = randomUUID()
      const tokenHash = hashSessionToken(token)
      const expiresAt = new Date(
        Date.now() + 60 * 60 * 24 * 7 * 1000,
      ).toISOString() // 7 days

      await db.insert(sessionsTable).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      })

      reply.setCookie('token', token, cookieOpts)

      return reply.status(200).send({ user })
    },
  )

  app.post(
    '/sign-out',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['auth'],
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.token!
      const tokenHash = hashSessionToken(token)
      await db.delete(sessionsTable).where(eq(sessionsTable.token, tokenHash))

      reply.clearCookie('token', {
        path: '/',
        secure: env.NODE_ENV === 'production',
      })

      return reply.status(200).send({ message: 'Signed out' })
    },
  )
}

export default authRoutes
