import { env } from '../config/env.js'

let cachedConnection = null

function createPendingConnection() {
  return {
    status: 'pending',
    client: env.database.client,
    message:
      'Conexao com banco ainda nao implementada. Configure DB_CLIENT e substitua este adaptador pelo driver real.',
  }
}

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection
  }

  if (env.database.client === 'none') {
    cachedConnection = {
      status: 'disabled',
      client: 'none',
      message:
        'Nenhum banco configurado ainda. Defina as variaveis do .env quando escolher o banco.',
    }

    return cachedConnection
  }

  cachedConnection = createPendingConnection()
  return cachedConnection
}

export function getDatabaseConfig() {
  return {
    client: env.database.client,
    host: env.database.host,
    port: env.database.port,
    name: env.database.name,
    user: env.database.user,
  }
}
