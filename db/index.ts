import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"
import type { NeonDatabase } from "drizzle-orm/neon-serverless"

let _db: NeonDatabase<typeof schema> | undefined
let _pool: Pool | undefined

export function getDb(): NeonDatabase<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  _pool = new Pool({ connectionString: url })
  _db = drizzle(_pool, { schema })
  return _db
}
