import { db } from '@/database'
import { sessionsTable } from '@/drizzle-schema'
import { UnauthorizedError } from '@/errors/app-error'
import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'

export async function checkTokenExists(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies.token

  if (!token) {
    throw new UnauthorizedError('Unauthorized')
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))

  if (!session) {
    throw new UnauthorizedError('Invalid session')
  }

  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token))
    throw new UnauthorizedError('Session expired')
  }

  request.userId = session.userId as string
}
