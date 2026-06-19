import { createBrowserClient } from "@supabase/ssr";

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || "https://vehsisogjdevyidzvrlh.supabase.co";
const supabaseKey = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_R_22Y5gK2k0tlso3d0F2bQ_t3SHwxir";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
