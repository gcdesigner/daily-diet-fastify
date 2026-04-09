import { checkTokenExists } from '@/middlewares/check-session'
import { getUserMetrics } from '@/services/user-metrics'
import type { FastifyInstance } from 'fastify'

const userMetricsRoutes = async (app: FastifyInstance) => {
  app.get('/', { preHandler: [checkTokenExists] }, async (request, reply) => {
    const { userId } = request

    const userMetrics = await getUserMetrics(userId!)

    return reply.status(200).send({ userMetrics })
  })
}

export default userMetricsRoutes
