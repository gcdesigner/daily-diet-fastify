import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { ZodError } from 'zod'

import { env } from '@/env'
import { AppError } from '@/errors/app-error'
import authRoutes from '@/routes/auth.router'
import mealRoutes from '@/routes/meal.router'
import userMetricsRoutes from '@/routes/user-metrics.router'
import userRoutes from '@/routes/user.router'

export const app = Fastify()

app.register(cookie, {
  secret: env.COOKIE_SECRET,
})

app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation error',
      details: error.issues,
    })
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
    })
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error)
  }

  return reply.status(500).send({ error: 'Internal server error' })
})

app.register(authRoutes, { prefix: '/auth' })
app.register(userRoutes, { prefix: '/users' })
app.register(mealRoutes, { prefix: '/meals' })
app.register(userMetricsRoutes, { prefix: '/user-metrics' })
