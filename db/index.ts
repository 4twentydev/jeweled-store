import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"

let _db: NeonHttpDatabase<typeof schema> | undefined

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  _db = drizzle(neon(url), { schema })
  return _db
}
