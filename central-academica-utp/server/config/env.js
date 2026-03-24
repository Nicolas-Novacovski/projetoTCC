import './load-env.js'

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  port: toNumber(process.env.PORT, 3001),
  database: {
    client: process.env.DB_CLIENT ?? 'none',
    host: process.env.DB_HOST ?? 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'central_academica',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  },
}
