import { db } from '@/database'
import { sessionsTable } from '@/drizzle-schema'
import { UnauthorizedError } from '@/errors/app-error'
import { hashSessionToken } from '@/utils/session-token'
import { eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'

export async function checkTokenExists(request: FastifyRequest): Promise<void> {
  const token = request.cookies.token

  if (!token) {
    throw new UnauthorizedError('Unauthorized')
  }

  const tokenHash = hashSessionToken(token)

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, tokenHash))

  if (!session) {
    throw new UnauthorizedError('Invalid session')
  }

  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, tokenHash))
    throw new UnauthorizedError('Session expired')
  }

  request.userId = session.userId
}
