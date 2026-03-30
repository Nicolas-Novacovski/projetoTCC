import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg
let cachedPool = null

export async function connectToDatabase() {
  if (cachedPool) {
    return cachedPool
  }

  const poolConfig = {
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }

  try {
    cachedPool = new Pool(poolConfig)

    const client = await cachedPool.connect()
    console.log('SUCESSO: Conectado ao banco de dados Neon (PostgreSQL)!')
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
  }
}
