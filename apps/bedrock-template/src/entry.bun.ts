import { createQwikCity } from "@builder.io/qwik-city/middleware/bun";
import qwikCityPlan from "@qwik-city-plan";

import render from "./entry.ssr";

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: {
    cacheControl: "public, max-age=31536000, immutable",
  },
});

const port = Number(Bun.env.PORT ?? 3000);

console.log(`website-template listening on http://localhost:${port}`);

Bun.serve({
  async fetch(request: Request) {
    const staticResponse = await staticFile(request);
    if (staticResponse) {
      return staticResponse;
    }

    const routedResponse = await router(request);
    if (routedResponse) {
      return routedResponse;
    }

    return notFound(request);
  },
  port,
});
