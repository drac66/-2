// Supabase Edge Function: albums-upload (base64 for mini program compatibility)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = req.headers.get('x-auth-token') || '';
  const { data: t } = await sb.from('app_tokens').select('openid').eq('token', token).maybeSingle();
  if (!t?.openid) return json({ success: false, message: 'unauthorized', data: null });

  const body = await req.json();
  const mediaType = body?.media_type || 'image';
  const note = (body?.note || '').trim();
  const base64 = body?.base64 || '';
  const ext = body?.ext || (mediaType === 'video' ? 'mp4' : 'jpg');
  if (!base64) return json({ success: false, message: 'base64 required', data: null });

  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const filename = `${crypto.randomUUID()}.${ext}`;
  const objectPath = `albums/${filename}`;

  const { error: upErr } = await sb.storage.from('albums').upload(objectPath, bytes, {
    contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
    upsert: false
  });
  if (upErr) return json({ success: false, message: upErr.message, data: null });

  const { data: pub } = sb.storage.from('albums').getPublicUrl(objectPath);
  const mediaUrl = pub.publicUrl;

  const { data, error } = await sb
    .from('couple_albums')
    .insert({ owner: t.openid, media_type: mediaType, media_url: mediaUrl, note })
    .select('id,media_url')
    .single();
  if (error) return json({ success: false, message: error.message, data: null });

  return json({ success: true, message: 'ok', data });
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
