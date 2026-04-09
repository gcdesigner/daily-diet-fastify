import { checkTokenExists } from '@/middlewares/check-session'
import { getUserMetrics } from '@/services/user-metrics'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const userMetricsResponseSchema = z.object({
  totalMeals: z.number(),
  totalMealsInDiet: z.number(),
  totalMealsOutOfDiet: z.number(),
  bestSequenceOfMealsInDiet: z.number(),
  percentageOfMealsInDiet: z.number(),
})

const userMetricsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      preHandler: [checkTokenExists],
      schema: {
        tags: ['user-metrics'],
        response: {
          200: z.object({
            userMetrics: userMetricsResponseSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const { userId } = request

      const userMetrics = await getUserMetrics(userId!)

      return reply.status(200).send({ userMetrics })
    },
  )
}

export default userMetricsRoutes
