import { app } from '@/app'
import { db } from '@/database'
import { sessionsTable } from '@/drizzle-schema'
import {
  createAuthenticatedClient,
  createAuthenticatedUser,
} from '@/test/helpers'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import request from 'supertest'

describe('Check Session Middleware', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should allow access to a route with a valid session', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.post('/meals', {
      name: 'Salada',
      description: 'Salada de folhas',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 1,
    })

    expect(response.status).toBe(201)
  })

  it('should not allow access to a route without a token', async () => {
    const response = await request(app.server).get('/meals')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
  })

  it('should not allow access with an invalid token', async () => {
    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', ['token=invalid-token-that-does-not-exist'])

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid session' })
  })

  it('should not allow access with an expired session', async () => {
    const { user } = await createAuthenticatedUser()

    const expiredToken = randomUUID()
    await db.insert(sessionsTable).values({
      userId: user.id,
      token: expiredToken,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    })

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', [`token=${expiredToken}`])

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Session expired' })

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token, expiredToken))

    expect(sessions).toHaveLength(0)
  })
})
