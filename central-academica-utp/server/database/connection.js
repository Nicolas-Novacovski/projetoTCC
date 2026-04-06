import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg
let cachedPool = null

export async function connectToDatabase() {
  if (cachedPool) {
    return cachedPool
  }

  const missingConfig = [
    ['DB_HOST', env.database.host],
    ['DB_NAME', env.database.name],
    ['DB_USER', env.database.user],
    ['DB_PASSWORD', env.database.password],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingConfig.length > 0) {
    throw new Error(
      `Configuracao do banco incompleta. Defina ${missingConfig.join(', ')} no arquivo .env antes de iniciar o backend.`,
    )
  }

  const poolConfig = {
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
  }

  if (env.database.ssl) {
    poolConfig.ssl = {
      rejectUnauthorized: env.database.sslRejectUnauthorized,
    }
  }

  try {
    cachedPool = new Pool(poolConfig)

    const client = await cachedPool.connect()
    console.log('SUCESSO: Conectado ao banco de dados PostgreSQL!')
    client.release()

    return cachedPool
  } catch (error) {
    console.error('ERRO FATAL: Nao foi possivel conectar ao banco.', error.message)
    cachedPool = null
    throw error
  }
}

export function getDatabaseConfig() {
  return {
    client: 'pg',
    host: env.database.host,
    port: env.database.port,
    name: env.database.name,
    user: env.database.user,
    ssl: env.database.ssl,
  }
}
