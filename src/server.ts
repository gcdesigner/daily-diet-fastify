import { app } from '@/app'
import { env } from '@/env'

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server is running on ${address}`)
  console.log(`Swagger is running on ${address}/docs`)
})
