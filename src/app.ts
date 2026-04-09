import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'

import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import Fastify from 'fastify'

import { env } from '@/env'
import { AppError } from '@/errors/app-error'
import authRoutes from '@/routes/auth.router'
import mealRoutes from '@/routes/meal.router'
import userMetricsRoutes from '@/routes/user-metrics.router'
import userRoutes from '@/routes/user.router'
import fastifySwaggerUi from '@fastify/swagger-ui'

export const app = Fastify()

// Adicionar o validator e o serializer compiler
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(cookie, {
  secret: env.COOKIE_SECRET,
})

const corsOrigin =
  env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) ?? env.NODE_ENV !== 'production'

app.register(cors, {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

if (env.NODE_ENV !== 'test') {
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })
}

app.setErrorHandler((error: unknown, _request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
    })
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'FST_ERR_VALIDATION'
  ) {
    return reply.status(400).send({
      error: 'Validation error',
    })
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error)
  }

  return reply.status(500).send({ error: 'Internal server error' })
})

if (env.NODE_ENV !== 'production') {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Daily Diet API',
        description: 'API for the Daily Diet application',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3333', description: 'Development server' },
      ],
    },
    transform: jsonSchemaTransform,
  })

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })
}

app.register(authRoutes, { prefix: '/auth' })
app.register(userRoutes, { prefix: '/users' })
app.register(mealRoutes, { prefix: '/meals' })
app.register(userMetricsRoutes, { prefix: '/user-metrics' })
