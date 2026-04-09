import { NotFoundError } from '@/errors/app-error'

export const takeUniqueOrThrow = (message: string) => {
  return <T>(values: T[]): T => {
    if (values.length !== 1) throw new NotFoundError(message)
    return values[0]!
  }
}
