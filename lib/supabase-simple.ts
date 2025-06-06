import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database-types"

export function createSimpleServerClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
