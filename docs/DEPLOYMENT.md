# Deployment checklist and Cloudflare Pages routing for rpcProxy

This guide helps you ensure the `rpcProxy` Cloudflare Function is reachable after deployment and how to test it.

1) Verify `wrangler.toml`
   - Ensure `pages_build_output_dir = "dist"` and `compatibility_flags = ["nodejs_compat"]` are present (this repo already has them).

2) Functions path on Cloudflare Pages
   - Cloudflare Pages exposes Functions under `/functions/<name>` by default. For example, a `functions/rpcProxy.js` file should be available at `https://<your-site>/functions/rpcProxy`.
   - If you prefer a different path (e.g., `/api/rpcProxy`), use a `_routes.json` or Pages routes to rewrite `/api/*` to `/functions/*`.

3) Recommended mapping (example `_routes.json`):

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/functions/$1" },
    { "src": "/functions/(.*)", "dest": "/functions/$1" }
  ]
}
```

4) After deployment, test the endpoints:
   - Proxy path: `https://<your-site>/functions/rpcProxy` (or `/api/rpcProxy` if you used rewrites)
   - Example test using PowerShell script included in `scripts/test-rpc-proxy.ps1` (Windows PowerShell). Run it and it will test the proxy and a direct endpoint.

5) Debugging tips
   - If the browser still shows `http provider parse response error`, open DevTools Network tab and inspect the JSON-RPC response body. If it's HTML or an error page, the provider is being routed to a non-JSON endpoint.
   - Check Pages logs for the function invocation. Cloudflare provides Execution logs for Functions in the Pages UI.

6) Quick manual test (curl / PowerShell)
   - POST JSON-RPC to the proxy:
     - body: { "jsonrpc":"2.0", "method":"net.getVersion", "params":[], "id":1 }
     - Expect: JSON response with version or similar result.

If you want, I can add a `_routes.json` and/or update `wrangler.toml` automatically to set a recommended mapping.
