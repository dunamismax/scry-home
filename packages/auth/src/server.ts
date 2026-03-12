import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { accounts, db, sessions, users, verifications } from '@scry-home/db'
import { betterAuth } from 'better-auth'

const secret = process.env.BETTER_AUTH_SECRET ?? 'development-only-secret'
const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

export const auth = betterAuth({
  baseURL,
  database: db
    ? drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          account: accounts,
          session: sessions,
          user: users,
          verification: verifications,
        },
      })
    : undefined,
  emailAndPassword: {
    enabled: true,
  },
  secret,
  trustedOrigins: [baseURL],
})
