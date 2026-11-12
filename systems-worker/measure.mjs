/* Entry of the lucksrei-systems Worker. It must export ONLY the default object (workerd rejects other named exports); logic is in handler.mjs.
 * fetch: POST /m counts, everything else falls to the static assets. scheduled: daily retention cleanup (cron in wrangler.systems.jsonc). */
import { handleMeasure, purgeOld } from "./handler.mjs";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/m") return handleMeasure(request, env);
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeOld(env, new Date(event.scheduledTime)));
  },
};
