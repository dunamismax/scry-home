import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/scry_home',
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/schema.ts',
})
