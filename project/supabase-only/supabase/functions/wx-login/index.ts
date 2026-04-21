// Supabase Edge Function: wx-login
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WECHAT_APPID = Deno.env.get('WECHAT_APPID') || '';
const WECHAT_SECRET = Deno.env.get('WECHAT_SECRET') || '';
const WECHAT_OPENID_WHITELIST = (Deno.env.get('WECHAT_OPENID_WHITELIST') || '').split(',').map(s => s.trim()).filter(Boolean);

Deno.serve(async (req) => {
  try {
    const { code } = await req.json();
    if (!code) return json({ success: false, message: 'code is required', data: null }, 200);

    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(WECHAT_APPID)}&secret=${encodeURIComponent(WECHAT_SECRET)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const wxResp = await fetch(wxUrl);
    const wx = await wxResp.json();

    if (wx.errcode && wx.errcode !== 0) {
      return json({ success: false, message: `wx login failed: ${wx.errmsg} (${wx.errcode})`, data: null }, 200);
    }

    const openid = wx.openid;
    if (!openid) return json({ success: false, message: 'openid missing', data: null }, 200);
    if (!WECHAT_OPENID_WHITELIST.includes(openid)) {
      return json({ success: false, message: 'no permission', data: null }, 200);
    }

    const token = crypto.randomUUID();
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await sb.from('app_tokens').insert({ token, openid });
    if (error) return json({ success: false, message: error.message, data: null }, 200);

    return json({ success: true, message: 'ok', data: { token, openid } }, 200);
  } catch (e: any) {
    return json({ success: false, message: e?.message || 'internal error', data: null }, 200);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
