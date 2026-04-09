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
      })
      .expect(201)

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.doe@example.com',
      }),
    )
  })

  it('should be able to get all users', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.get('/users')

    expect(response.body.users).toHaveLength(1)
    expect(response.body.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: 'John Doe',
          email: 'john.doe@example.com',
        }),
      ]),
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
    })

    const response = await request(app.server).post('/users').send({
      name: 'Jane Doe',
      email: 'john@example.com',
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('User already exists')
  })

  it('should not create a user with invalid email', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'invalid-email',
    })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'Internal server error' })
  })

  it('should return error when user is not found', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.get(
      '/users/00000000-0000-0000-0000-000000000000',
    )

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'User not found' })
  })
})
