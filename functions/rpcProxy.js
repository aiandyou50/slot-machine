// (EN) Cloudflare Pages Function: RPC Proxy for TON JSON-RPC requests
// (KO) Cloudflare Pages 함수: TON JSON-RPC 요청을 위한 프록시
// Purpose: Some browser environments or RPC providers cause parse/response issues
// from the frontend (CORS, intermediate proxies, or unexpected content types).
// This function provides a small, whitelist-based proxy that forwards JSON-RPC
// requests to known good TON RPC endpoints and returns the raw response.
// NOTE: This is intentionally small and whitelist-only to avoid becoming an open proxy.

const ALLOWED_ENDPOINTS = [
  'https://testnet.toncenter.com/api/v2/jsonRPC',
  'https://net.ton.dev',
  'https://mainnet.toncenter.com/api/v2/jsonRPC'
];

// Helper to build consistent CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequest(context) {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
    });
  }

  try {
    // Accept either a wrapper body { endpoint, payload } OR a raw JSON-RPC body
    const contentType = request.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await request.json();
    }

    // Determine target endpoint.
    // Priority: query param ?use=N -> body.endpoint if allowed -> default to first allowed endpoint
    const url = new URL(request.url);
    let target = null;
    if (url.searchParams.has('use')) {
      const idx = parseInt(url.searchParams.get('use')) || 0;
      target = ALLOWED_ENDPOINTS[idx] || ALLOWED_ENDPOINTS[0];
      console.log('rpcProxy: using endpoint index', idx, target);
    } else if (body && typeof body === 'object' && body.endpoint) {
      if (ALLOWED_ENDPOINTS.includes(body.endpoint)) target = body.endpoint;
      else {
        return new Response(JSON.stringify({ error: 'Endpoint not allowed.' }), {
          status: 403,
          headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
        });
      }
    } else {
      // default to first allowed
      target = ALLOWED_ENDPOINTS[0];
      console.log('rpcProxy: no endpoint provided, defaulting to', target);
    }

    // Determine payload to forward.
    let payload = null;
    if (body && body.payload) {
      payload = body.payload;
    } else if (body && (body.jsonrpc || body.method)) {
      payload = body; // raw JSON-RPC
    } else {
      // Try to read raw text
      const text = await request.text();
      try {
        payload = JSON.parse(text);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON-RPC payload.' }), {
          status: 400,
          headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
        });
      }
    }

    console.log('rpcProxy: forwarding to', target, 'payload method:', payload.method || payload.jsonrpc || 'unknown');

    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('rpcProxy: response status', res.status, 'body snippet', text.slice(0, 300));

    const responseHeaders = Object.assign({ 'Content-Type': 'application/json' }, corsHeaders());
    return new Response(text, { status: res.status, headers: responseHeaders });
  } catch (err) {
    console.error('rpcProxy error:', err);
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: err.message }), {
      status: 500,
      headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
    });
  }
}
