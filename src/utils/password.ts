import bcrypt from 'bcryptjs'

// Cost factor lower in test to keep the suite fast
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}
