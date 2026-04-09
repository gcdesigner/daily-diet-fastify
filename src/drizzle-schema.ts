import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { randomUUID } from 'node:crypto'

const id = text('id', { length: 36 })
  .primaryKey()
  .$defaultFn(() => randomUUID())

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$onUpdateFn(() => new Date().toISOString()),
}

export const sessionsTable = sqliteTable('sessions_table', {
  id,
  userId: text('user_id', { length: 36 }).references(() => usersTable.id),
  token: text('token').notNull().unique(),
  createdAt: timestamps.createdAt,
  expiresAt: text('expires_at').notNull(),
})

export const usersTable = sqliteTable('users_table', {
  id,
  name: text().notNull(),
  email: text().notNull().unique(),
})

export const mealsTable = sqliteTable('meals_table', {
  id,
  userId: text('user_id', { length: 36 }).references(() => usersTable.id),
  name: text().notNull(),
  description: text(),
  date: text().notNull(),
  time: text().notNull(),
  isDiet: integer('is_diet').notNull().default(0),
  ...timestamps,
})

export type User = typeof usersTable.$inferInsert
export type Session = typeof sessionsTable.$inferInsert
export type Meals = typeof mealsTable.$inferSelect
