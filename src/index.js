// This worker is used to enable static site serving via the `[site]` configuration in wrangler.toml.
// By existing, it signals to Wrangler that this is a Worker project.
// It does not need an active fetch handler, as the static assets will be served automatically.
export default {};
