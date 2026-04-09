import { app } from '@/app'
import { createAuthenticatedClient } from '@/test/helpers'

describe('Meal Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create a new meal', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.post('/meals', {
      name: 'Salada',
      description: 'Salada de folhas',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 1,
    })

    expect(response.status).toBe(201)
    expect(response.body.meal).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Salada',
        isDiet: 1,
      }),
    )
  })

  it('should be able to get all meals from a user', async () => {
    const { client } = await createAuthenticatedClient()

    await client.post('/meals', {
      name: 'Salada',
      description: 'Salada de folhas',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 1,
    })

    const response = await client.get('/meals')

    expect(response.status).toBe(200)
    expect(response.body.meals).toHaveLength(1)
    expect(response.body.meals).toEqual([
      expect.objectContaining({
        name: 'Salada',
        description: 'Salada de folhas',
        date: '2021-01-01',
        time: '10:00:00',
        isDiet: 1,
      }),
    ])
  })
})
