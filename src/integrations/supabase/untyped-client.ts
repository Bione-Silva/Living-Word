// Re-export supabase client cast to `any` for tables not yet in types.ts
// This avoids TS errors for unmapped tables (page_views, mind_settings, etc.)
import { supabase } from './client';
export const db = supabase as any;
