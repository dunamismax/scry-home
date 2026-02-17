import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

import { ThemeToggle } from "~/components/theme-toggle";
import type { AppUser } from "~/lib/auth-utils.server";
import { cn } from "~/lib/utils";

type SiteNavProps = {
  user: AppUser | null;
};

type NavItemConfig = {
  href: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
};

const navItems: NavItemConfig[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard", requiresAuth: true },
  { href: "/admin/users", label: "Admin", adminOnly: true },
];

export const SiteNav = component$<SiteNavProps>(({ user }) => {
  const loc = useLocation();
  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "admin";
    }
    if (item.requiresAuth) {
      return !!user;
    }
    return true;
  });

  return (
    <header
      class="sticky top-0 z-50 border-b"
      style={{ background: "var(--nav-bg)", borderColor: "var(--border)" }}
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-6">
          <Link
            class="inline-flex items-center gap-2 font-semibold tracking-tight"
            href="/"
            prefetch={false}
          >
            <span
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold"
              style={{ background: "var(--accent)", color: "#f8fdff" }}
            >
              BT
            </span>
            <span>website-template</span>
          </Link>

          <nav class="hidden items-center gap-1 md:flex">
            {visibleNavItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                active={
                  item.href === "/"
                    ? loc.url.pathname === "/"
                    : loc.url.pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>
        </div>

        <div class="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <p class="hidden max-w-[220px] truncate text-sm muted sm:block">{user.email}</p>
              <form action="/auth/sign-out" method="post">
                <button class="btn btn-secondary h-9" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link class="btn btn-ghost h-9" href="/auth/sign-in" prefetch={false}>
                Sign in
              </Link>
              <Link class="btn btn-primary h-9" href="/auth/sign-up" prefetch={false}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <nav class="border-t md:hidden" style={{ borderColor: "var(--border)" }}>
        <div class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
          {visibleNavItems.map((item) => (
            <NavItem
              key={`${item.href}-mobile`}
              compact
              href={item.href}
              label={item.label}
              active={
                item.href === "/"
                  ? loc.url.pathname === "/"
                  : loc.url.pathname.startsWith(item.href)
              }
            />
          ))}
        </div>
      </nav>
    </header>
  );
});

type NavItemProps = {
  href: string;
  label: string;
  active: boolean;
  compact?: boolean;
};

export const NavItem = component$<NavItemProps>(({ href, label, active, compact }) => {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      class={cn("nav-item", active && "nav-item-active", compact && "nav-pill")}
      href={href}
      prefetch={false}
    >
      {label}
    </Link>
  );
});
