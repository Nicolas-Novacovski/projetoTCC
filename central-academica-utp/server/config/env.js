import dotenv from 'dotenv'

dotenv.config()

function parseBoolean(value, defaultValue = false) {
  if (value == null || value === '') {
    return defaultValue
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

function readEnv(value) {
  if (value == null) {
    return undefined
  }

  const normalizedValue = String(value).trim()
  return normalizedValue === '' ? undefined : normalizedValue
}

export const env = {
  port: Number(process.env.PORT) || 3333,
  database: {
    client: process.env.DB_CLIENT || 'pg',
    host: readEnv(process.env.DB_HOST),
    port: Number(process.env.DB_PORT) || 5432,
    name: readEnv(process.env.DB_NAME),
    user: readEnv(process.env.DB_USER),
    password: readEnv(process.env.DB_PASSWORD),
    ssl: parseBoolean(process.env.DB_SSL, false),
    sslRejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
  },
}
