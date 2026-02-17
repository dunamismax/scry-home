import { component$, Slot } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

import { cn } from "~/lib/utils";

type AppShellProps = {
  isAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
  { href: "/admin/users", label: "Users", adminOnly: true },
];

export const AppShell = component$<AppShellProps>(({ isAdmin }) => {
  const loc = useLocation();
  const visibleItems = navItems.filter((item) => (item.adminOnly ? isAdmin : true));

  return (
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
      <aside class="surface p-3">
        <nav class="space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              class={cn(
                "nav-item flex items-center gap-2 px-3 py-2",
                loc.url.pathname.startsWith(item.href) && "nav-item-active",
              )}
              href={item.href}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main class="reveal" id="main-content">
        <Slot />
      </main>
    </div>
  );
});
