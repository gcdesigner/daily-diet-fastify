import { db } from '@/database'
import { mealsTable } from '@/drizzle-schema'
import { ForbiddenError } from '@/errors/app-error'
import { checkTokenExists } from '@/middlewares/check-session'
import { takeUniqueOrThrow } from '@/utils/drizzle-utils'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const mealBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.string().date(),
  time: z.string().time(),
  isDiet: z.coerce.number(),
})

const mealRoutes = async (app: FastifyInstance) => {
  app.get('/', { preHandler: [checkTokenExists] }, async (request, reply) => {
    const meals = await db
      .select()
      .from(mealsTable)
      .where(eq(mealsTable.userId, request.userId!))

    return reply.status(200).send({ meals })
  })

  app.get(
    '/:id',
    { preHandler: [checkTokenExists] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params)

      const meal = await db
        .select()
        .from(mealsTable)
        .where(eq(mealsTable.id, id))
        .then(takeUniqueOrThrow('Meal not found'))

      if (meal.userId !== request.userId) {
        throw new ForbiddenError('You can only access your own meals')
      }

      return reply.status(200).send({ meal })
    },
  )

  app.post('/', { preHandler: [checkTokenExists] }, async (request, reply) => {
    const { name, description, date, time, isDiet } = mealBodySchema.parse(
      request.body,
    )

    const [meal] = await db
      .insert(mealsTable)
      .values({
        userId: request.userId,
        name,
        description,
        date,
        time,
        isDiet,
      })
      .returning()

    return reply.status(201).send({ meal })
  })

  app.put(
    '/:id',
    { preHandler: [checkTokenExists] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params)

      const existingMeal = await db
        .select()
        .from(mealsTable)
        .where(eq(mealsTable.id, id))
        .then(takeUniqueOrThrow('Meal not found'))

      if (existingMeal.userId !== request.userId) {
        throw new ForbiddenError('You can only update your own meals')
      }

      const { name, description, date, time, isDiet } = mealBodySchema.parse(
        request.body,
      )

      const [meal] = await db
        .update(mealsTable)
        .set({ name, description, date, time, isDiet })
        .where(eq(mealsTable.id, id))
        .returning()

      return reply.status(200).send({ meal })
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkTokenExists] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params)

      const existingMeal = await db
        .select()
        .from(mealsTable)
        .where(eq(mealsTable.id, id))
        .then(takeUniqueOrThrow('Meal not found'))

      if (existingMeal.userId !== request.userId) {
        throw new ForbiddenError('You can only delete your own meals')
      }

      await db.delete(mealsTable).where(eq(mealsTable.id, id))

      return reply.status(204).send()
    },
  )
}

export default mealRoutes
