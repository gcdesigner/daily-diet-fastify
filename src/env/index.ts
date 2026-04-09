import { config } from 'dotenv'
import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config({ path: '.env' })
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3333),
  DB_FILE_NAME: z.string(),
  COOKIE_SECRET: z.string(),
  /** Origens CORS permitidas (vírgula). Em produção, defina explicitamente. */
  CORS_ORIGIN: z.string().optional(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format())
  process.exit(1)
}

export const env = _env.data
