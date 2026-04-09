import { eq, sql } from 'drizzle-orm'
import { db } from '../database'
import { mealsTable } from '../drizzle-schema'

export async function getUserMetrics(userId: string) {
  const [totals] = await db
    .select({
      totalMeals: sql<number>`count(*)`,
      totalMealsInDiet: sql<number>`sum(case when ${mealsTable.isDiet} = 1 then 1 else 0 end)`,
      totalMealsOutOfDiet: sql<number>`sum(case when ${mealsTable.isDiet} = 0 then 1 else 0 end)`,
    })
    .from(mealsTable)
    .where(eq(mealsTable.userId, userId))

  const meals = await db
    .select({ isDiet: mealsTable.isDiet })
    .from(mealsTable)
    .where(eq(mealsTable.userId, userId))
    .orderBy(mealsTable.date, mealsTable.time)

  let currentStreak = 0
  let bestStreak = 0
  for (const meal of meals) {
    if (meal.isDiet === 1) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  const totalMeals = totals?.totalMeals ?? 0
  const totalMealsInDiet = totals?.totalMealsInDiet ?? 0

  return {
    totalMeals,
    totalMealsInDiet,
    totalMealsOutOfDiet: totals?.totalMealsOutOfDiet ?? 0,
    bestSequenceOfMealsInDiet: bestStreak,
    percentageOfMealsInDiet:
      totalMeals > 0 ? Math.round((totalMealsInDiet / totalMeals) * 100) : 0,
  }
}
