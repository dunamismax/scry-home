import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

export const sql = connectionString
  ? postgres(connectionString, {
      max: 5,
      prepare: false,
    })
  : null

export const db = sql ? drizzle(sql, { schema }) : null

export const requireDb = () => {
  if (!db) {
    throw new Error('DATABASE_URL is not configured.')
  }

  return db
}
