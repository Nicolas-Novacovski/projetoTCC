import { createServer } from 'node:http'
import { env } from './config/env.js'
import { handleRoutes } from './routes/index.js'

const server = createServer(async (request, response) => {
  try {
    await handleRoutes(request, response)
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    response.end(
      JSON.stringify(
        {
          status: 'error',
          message: 'Erro interno no servidor.',
          details: error instanceof Error ? error.message : 'Erro desconhecido.',
        },
        null,
        2,
      ),
    )
  }
})

server.listen(env.port, () => {
  console.log(`Backend iniciado em http://localhost:${env.port}`)
})
