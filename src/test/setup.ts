import { db } from '@/database'
import { mealsTable, sessionsTable, usersTable } from '@/drizzle-schema'
import { migrate } from 'drizzle-orm/libsql/migrator'

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './drizzle' })
})

beforeEach(async () => {
  await db.delete(mealsTable)
  await db.delete(sessionsTable)
  await db.delete(usersTable)
})
