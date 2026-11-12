/* lucksrei-systems Worker entry. Only POST /m runs code (assets.run_worker_first = ["/m"]); everything else is served by the assets layer.
 * The logic, the privacy rules and the allow-lists live in handler.mjs. This file must export ONLY the default handler (workerd rejects
 * other named exports). */
import { handleMeasure } from "./handler.mjs";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/m") return handleMeasure(request, env);
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("not found", { status: 404 });
  },
};
