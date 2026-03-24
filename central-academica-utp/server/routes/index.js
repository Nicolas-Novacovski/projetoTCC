import { connectToDatabase, getDatabaseConfig } from '../database/connection.js'

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })

  response.end(JSON.stringify(payload, null, 2))
}

export async function handleRoutes(request, response) {
  const { method, url } = request

  if (method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })

    response.end()
    return
  }

  if (method === 'GET' && url === '/api/health') {
    return sendJson(response, 200, {
      status: 'ok',
      service: 'central-academica-backend',
      timestamp: new Date().toISOString(),
    })
  }

  if (method === 'GET' && url === '/api/database') {
    const connection = await connectToDatabase()

    return sendJson(response, 200, {
      connection,
      config: getDatabaseConfig(),
      nextStep:
        'Troque server/database/connection.js pelo adaptador do banco escolhido e instale o driver correspondente.',
    })
  }

  return sendJson(response, 404, {
    status: 'error',
    message: 'Rota nao encontrada.',
  })
}
