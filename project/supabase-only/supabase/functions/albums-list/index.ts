// Supabase Edge Function: albums-list
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = req.headers.get('x-auth-token') || '';
  const { data: t } = await sb.from('app_tokens').select('openid').eq('token', token).maybeSingle();
  if (!t?.openid) return json({ success: false, message: 'unauthorized', data: null });

  const { data, error } = await sb.from('couple_albums').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return json({ success: false, message: error.message, data: null });
  return json({ success: true, message: 'ok', data });
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
