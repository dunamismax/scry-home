import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, useLocation } from "@builder.io/qwik-city";

import { AppShell } from "~/components/app-shell";
import { requireAuth } from "~/lib/auth-utils.server";
import { countAssetsByUser, listAssetsByUser } from "~/lib/storage.server";
import { countActiveUsers, countUsers } from "~/lib/users.server";
import { formatBytes } from "~/lib/utils";

export const useDashboardLoader = routeLoader$(async (event) => {
  const authState = await requireAuth(event);

  const [userCount, activeUsers, ownedAssetCount, recentAssets] = await Promise.all([
    authState.user.role === "admin" ? countUsers() : Promise.resolve(0),
    authState.user.role === "admin" ? countActiveUsers() : Promise.resolve(0),
    countAssetsByUser(authState.user.id),
    listAssetsByUser(authState.user.id, 10),
  ]);

  return {
    user: authState.user,
    stats: {
      userCount,
      activeUsers,
      ownedAssetCount,
    },
    assets: recentAssets,
  };
});

export default component$(() => {
  const dashboard = useDashboardLoader();
  const loc = useLocation();

  return (
    <AppShell isAdmin={dashboard.value.user.role === "admin"}>
      <div class="space-y-6">
        <div class="reveal">
          <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p class="muted mt-1 text-sm">
            Signed in as <strong>{dashboard.value.user.email}</strong>
          </p>
        </div>

        {loc.url.searchParams.get("uploaded") === "1" ? (
          <p class="notice notice-success reveal">Upload completed.</p>
        ) : null}

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Role" value={dashboard.value.user.role} />
          <StatCard label="My uploads" value={String(dashboard.value.stats.ownedAssetCount)} />
          {dashboard.value.user.role === "admin" ? (
            <StatCard label="Total users" value={String(dashboard.value.stats.userCount)} />
          ) : null}
          {dashboard.value.user.role === "admin" ? (
            <StatCard label="Active users" value={String(dashboard.value.stats.activeUsers)} />
          ) : null}
        </div>

        <section class="surface defer-section p-6 reveal reveal-2">
          <h2 class="text-lg font-semibold">Upload file to MinIO</h2>
          <p class="muted mt-1 text-sm">Stored under your account namespace.</p>

          <form
            action="/api/upload"
            class="mt-4 flex flex-col gap-3 sm:flex-row"
            enctype="multipart/form-data"
            method="post"
          >
            <input class="file-input" name="file" required type="file" />
            <button class="btn btn-primary" type="submit">
              Upload
            </button>
          </form>
          <p class="muted mt-2 text-xs">
            Default max size is 10 MB. Configure with `MAX_UPLOAD_BYTES`.
          </p>
        </section>

        <section class="surface defer-section p-6 reveal reveal-3">
          <h2 class="text-lg font-semibold">Recent uploads</h2>
          <p class="muted mt-1 text-sm">Latest objects you uploaded.</p>

          {dashboard.value.assets.length === 0 ? (
            <p class="muted mt-4 text-sm">No uploads yet.</p>
          ) : (
            <div class="mt-4 overflow-auto">
              <table class="data-table text-sm">
                <thead>
                  <tr>
                    <th class="pb-2 font-medium">File</th>
                    <th class="pb-2 font-medium">Type</th>
                    <th class="pb-2 font-medium">Size</th>
                    <th class="pb-2 font-medium">Object Key</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.value.assets.map((asset) => (
                    <tr key={asset.id}>
                      <td class="py-2 font-medium">{asset.originalFileName}</td>
                      <td class="table-cell-subtle py-2">{asset.contentType}</td>
                      <td class="table-cell-subtle py-2">{formatBytes(asset.sizeBytes)}</td>
                      <td class="table-cell-subtle max-w-[220px] truncate py-2 text-xs">
                        {asset.objectKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div class="text-sm">
          <Link class="inline-link" href="/settings" prefetch={false}>
            Open settings and jobs
          </Link>
        </div>
      </div>
    </AppShell>
  );
});

type StatCardProps = {
  label: string;
  value: string;
};

const StatCard = component$<StatCardProps>(({ label, value }) => {
  return (
    <article class="kpi-card reveal">
      <p class="kpi-label">{label}</p>
      <p class="kpi-value">{value}</p>
    </article>
  );
});

export const head: DocumentHead = {
  title: "Dashboard | website-template",
};
