import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import spaceGroteskLatinWoff2Url from "@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url";

import { RouterHead } from "~/components/router-head";

import "./global.css";

const themeBootScript = `(() => {
  const storageKey = "scry-theme";
  const root = document.documentElement;

  let stored = "";
  try {
    stored = localStorage.getItem(storageKey) || "";
  } catch {
    stored = "";
  }

  const theme = stored === "light" ? "light" : "dark";
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={themeBootScript} />
        <link
          as="font"
          crossOrigin="anonymous"
          fetchPriority="high"
          href={spaceGroteskLatinWoff2Url}
          rel="preload"
          type="font/woff2"
        />
        {!isDev && <link rel="manifest" href={`${import.meta.env.BASE_URL}manifest.json`} />}
        <RouterHead />
      </head>
      <body lang="en" class="min-h-full antialiased">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
