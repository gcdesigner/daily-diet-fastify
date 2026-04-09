import { app } from '@/app'
import { createAuthenticatedClient } from '@/test/helpers'

const defaultUserMetrics = {
  totalMeals: 0,
  totalMealsInDiet: 0,
  totalMealsOutOfDiet: 0,
  bestSequenceOfMealsInDiet: 0,
  percentageOfMealsInDiet: 0,
}

describe('User Metrics Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to get user metrics', async () => {
    const { client } = await createAuthenticatedClient()

    const response = await client.get('/user-metrics')

    expect(response.body.userMetrics).toEqual(
      expect.objectContaining({ ...defaultUserMetrics }),
    )
  })

  it('should be able to update user metrics with a meal in diet', async () => {
    const { client } = await createAuthenticatedClient()

    await client.post('/meals', {
      name: 'Meal',
      description: 'Meal',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 1,
    })

    const response = await client.get('/user-metrics')

    expect(response.body.userMetrics).toEqual(
      expect.objectContaining({
        totalMeals: 1,
        totalMealsInDiet: 1,
        totalMealsOutOfDiet: 0,
        bestSequenceOfMealsInDiet: 1,
        percentageOfMealsInDiet: 100,
      }),
    )
  })

  it('should be able to update user metrics with a meal out of diet', async () => {
    const { client } = await createAuthenticatedClient()

    await client.post('/meals', {
      name: 'Meal',
      description: 'Meal',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 0,
    })

    const response = await client.get('/user-metrics')

    expect(response.body.userMetrics).toEqual(
      expect.objectContaining({
        totalMeals: 1,
        totalMealsInDiet: 0,
        totalMealsOutOfDiet: 1,
        bestSequenceOfMealsInDiet: 0,
        percentageOfMealsInDiet: 0,
      }),
    )
  })

  it('should keep the best sequence of meals in diet', async () => {
    const { client } = await createAuthenticatedClient()

    await client.post('/meals', {
      name: 'Meal 1',
      description: 'Meal',
      date: '2021-01-01',
      time: '10:00:00',
      isDiet: 1,
    })
    await client.post('/meals', {
      name: 'Meal 2',
      description: 'Meal',
      date: '2021-01-02',
      time: '10:00:00',
      isDiet: 0,
    })
    await client.post('/meals', {
      name: 'Meal 3',
      description: 'Meal',
      date: '2021-01-03',
      time: '10:00:00',
      isDiet: 1,
    })
    await client.post('/meals', {
      name: 'Meal 4',
      description: 'Meal',
      date: '2021-01-04',
      time: '10:00:00',
      isDiet: 1,
    })

    const response = await client.get('/user-metrics')

    expect(response.body.userMetrics).toEqual(
      expect.objectContaining({
        bestSequenceOfMealsInDiet: 2,
      }),
    )
  })
})
