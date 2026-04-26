import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { getEnv } from "@/lib/env"
import * as schema from "./schema"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"

let _db: NeonHttpDatabase<typeof schema> | undefined

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db
  _db = drizzle(neon(getEnv().DATABASE_URL), { schema })
  return _db
}
