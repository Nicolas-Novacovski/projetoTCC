import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { connectToDatabase } from './database/connection.js'
import { ensureSeedData } from './database/seed.js'
import { router } from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', router)

app.use((error, _request, response, _next) => {
  console.error('Erro interno no servidor.', error)

  response.status(500).json({
    status: 'error',
    message: 'Erro interno no servidor.',
    details: error instanceof Error ? error.message : 'Erro desconhecido.',
  })
})

async function bootstrap() {
  await connectToDatabase()
  await ensureSeedData()

  app.listen(env.port, () => {
    console.log(`Backend iniciado em http://localhost:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar a aplicacao.', error)
  process.exit(1)
})
