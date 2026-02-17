import { $, component$ } from "@builder.io/qwik";

const STORAGE_KEY = "scry-theme";

export const ThemeToggle = component$(() => {
  const toggleTheme = $(() => {
    const root = document.documentElement;
    const currentTheme = root.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore persistence failures for private browsing modes.
    }
  });

  return (
    <button
      aria-label="Toggle dark and light theme"
      class="btn btn-ghost h-9 min-w-20 px-3 text-xs sm:text-sm"
      onClick$={toggleTheme}
      type="button"
    >
      Theme
    </button>
  );
});
