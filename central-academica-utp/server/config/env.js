import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env')

dotenv.config({ path: envPath })

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
  mail: {
    host: readEnv(process.env.SMTP_HOST),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: readEnv(process.env.SMTP_USER),
    password: readEnv(process.env.SMTP_PASSWORD),
    from: readEnv(process.env.SMTP_FROM) || readEnv(process.env.SMTP_USER),
  },
}
