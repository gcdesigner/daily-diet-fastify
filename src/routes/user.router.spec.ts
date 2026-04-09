import { app } from '@/app'
import { createAuthenticatedClient } from '@/test/helpers'
import request from 'supertest'

describe('User Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'secret123',
      })
      .expect(201)

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.doe@example.com',
      }),
    )
    expect(response.body.user.password).toBeUndefined()
  })

  it('should be able to get the authenticated user profile', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.get('/users/me')

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.doe@example.com',
      }),
    )
  })

  it('should be able to get a user by id', async () => {
    const { user, client } = await createAuthenticatedClient()

    const response = await client.get(`/users/${user.id}`)

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: user.id,
        name: 'John Doe',
        email: 'john.doe@example.com',
      }),
    )
  })

  it('should be able to edit a user', async () => {
    const { user, client } = await createAuthenticatedClient()

    const response = await client.put(`/users/${user.id}`, {
      name: 'John Doe - Edited',
    })

    expect(response.body.user.name).toBe('John Doe - Edited')
    expect(response.body.user.email).toBe('john.doe@example.com')
  })

  it('should not create a user with duplicate email', async () => {
    await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secret123',
    })

    const response = await request(app.server).post('/users').send({
      name: 'Jane Doe',
      email: 'john@example.com',
      password: 'secret456',
    })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('User already exists')
  })

  it('should not create a user with invalid email', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'secret123',
    })

    expect(response.status).toBe(400)
  })

  it('should not create a user with short password', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'john.short@example.com',
      password: '123',
    })

    expect(response.status).toBe(400)
  })

  it('should return forbidden when updating another user id', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.put(
      '/users/00000000-0000-0000-0000-000000000000',
      { name: 'Hacker' },
    )

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Cannot update this user' })
  })

  it('should return forbidden when accessing another user id', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.get(
      '/users/00000000-0000-0000-0000-000000000000',
    )

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Cannot access this user' })
  })

  it('should be able to delete own account and cascade relations', async () => {
    const { user, client } = await createAuthenticatedClient()

    const response = await client.delete(`/users/${user.id}`)

    expect(response.status).toBe(204)
  })

  it('should not be able to delete another user account', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.delete(
      '/users/00000000-0000-0000-0000-000000000000',
    )

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Cannot delete this user' })
  })
})
