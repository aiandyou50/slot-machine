// This is the entry point for your Worker.
// This file is intentionally blank for a static site deployment.
// The `wrangler.toml` file will automatically configure the Worker
// to serve static assets from the directory specified in the `[site].bucket` property.

// For more details, refer to the Cloudflare Workers documentation for static sites:
// https://developers.cloudflare.com/workers/platform/sites/

export default {
  async fetch(request, env, ctx) {
    // This worker is a passthrough for static assets.
    // It doesn't need to do anything special.
    // The static assets are served automatically by the configuration in wrangler.toml
    return new Response("This is a passthrough worker for a static site. The content should be served from the 'public' directory.");
  },
};
