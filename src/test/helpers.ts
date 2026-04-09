// src/test/helpers.ts
import { app } from '@/app'
import type { User } from '@/drizzle-schema'
import request from 'supertest'

export async function createAuthenticatedUser(
  data = { name: 'John Doe', email: 'john.doe@example.com' },
) {
  const createResponse = await request(app.server).post('/users').send(data)
  const user = createResponse.body.user as User

  const signInResponse = await request(app.server)
    .post('/auth/sign-in')
    .send({ email: data.email })

  const cookies = (signInResponse.headers['set-cookie'] ?? []) as string[]

  return { user, cookies }
}

export async function createAuthenticatedClient(
  data = { name: 'John Doe', email: 'john.doe@example.com' },
) {
  const { user, cookies } = await createAuthenticatedUser(data)

  const client = {
    get: (url: string) => request(app.server).get(url).set('Cookie', cookies),
    post: (url: string, body: object) =>
      request(app.server).post(url).set('Cookie', cookies).send(body),
    put: (url: string, body: object) =>
      request(app.server).put(url).set('Cookie', cookies).send(body),
    delete: (url: string) =>
      request(app.server).delete(url).set('Cookie', cookies),
  }

  return { user, client }
}
