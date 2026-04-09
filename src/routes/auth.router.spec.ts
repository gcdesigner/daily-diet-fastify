import { app } from '@/app'
import { createAuthenticatedClient } from '@/test/helpers'
import request from 'supertest'

describe('Auth Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to sign in', async () => {
    await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    const response = await request(app.server)
      .post('/auth/sign-in')
      .send({ email: 'john.doe@example.com' })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: expect.any(String),
          name: 'John Doe',
          email: 'john.doe@example.com',
        }),
      }),
    )
  })

  it('should not sign in with non-existent email', async () => {
    const response = await request(app.server)
      .post('/auth/sign-in')
      .send({ email: 'naoexiste@example.com' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid credentials' })
  })

  it('should be able to sign out', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.post('/auth/sign-out', {})
    expect(response.status).toBe(200)

    const setCookie = response.headers['set-cookie']?.[0] ?? ''
    expect(setCookie).toMatch(/token=;/)
  })
})
