/**
 * Living Word — fetch-bible-verse
 * HTTP handler for direct testing of bible verse fetching.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse } from "../common/utils.ts"
import { fetchBibleVerse } from "../common/bible-fetch.ts"
import type { BibleVersion } from "../common/bible-fetch.ts"

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const { passage, version, language } = await req.json()
  if (!passage || !version) {
    return new Response(JSON.stringify({ error: "passage and version required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const result = await fetchBibleVerse(passage, version as BibleVersion, language ?? "PT")
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
