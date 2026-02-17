import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { z } from "zod";

import { AppShell } from "~/components/app-shell";
import { writeAuditEvent } from "~/lib/audit.server";
import { requirePermission } from "~/lib/auth-utils.server";
import { getSameOriginError } from "~/lib/http.server";
import { roles } from "~/lib/rbac";
import { listUsers, setUserActive, setUserRole } from "~/lib/users.server";

const updateRoleSchema = z.object({
  intent: z.literal("set-role"),
  userId: z.string().min(1),
  role: z.enum(roles),
});

const updateActiveSchema = z.object({
  intent: z.literal("set-active"),
  userId: z.string().min(1),
  isActive: z.enum(["true", "false"]),
});

export const useUsersLoader = routeLoader$(async (event) => {
  const authState = await requirePermission(event, "manage_users");
  const users = await listUsers();

  return {
    currentUserId: authState.user.id,
    users,
    isAdmin: authState.user.role === "admin",
  };
});

export const useUsersAction = routeAction$(async (_, event) => {
  const sameOriginError = getSameOriginError(event.request);
  if (sameOriginError) {
    event.status(403);
    return { error: sameOriginError };
  }

  const authState = await requirePermission(event, "manage_users");
  const formData = await event.request.formData();

  const roleUpdate = updateRoleSchema.safeParse({
    intent: formData.get("intent"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (roleUpdate.success) {
    if (roleUpdate.data.userId === authState.user.id && roleUpdate.data.role !== "admin") {
      throw event.redirect(302, "/admin/users?error=cannot-demote-self");
    }

    await setUserRole(roleUpdate.data.userId, roleUpdate.data.role);
    await writeAuditEvent({
      actorUserId: authState.user.id,
      action: "users.set_role",
      targetType: "user",
      targetId: roleUpdate.data.userId,
      metadata: { role: roleUpdate.data.role },
    });

    throw event.redirect(302, "/admin/users?updated=role");
  }

  const activeUpdate = updateActiveSchema.safeParse({
    intent: formData.get("intent"),
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });

  if (activeUpdate.success) {
    if (activeUpdate.data.userId === authState.user.id && activeUpdate.data.isActive === "false") {
      throw event.redirect(302, "/admin/users?error=cannot-disable-self");
    }

    await setUserActive(activeUpdate.data.userId, activeUpdate.data.isActive === "true");
    await writeAuditEvent({
      actorUserId: authState.user.id,
      action: "users.set_active",
      targetType: "user",
      targetId: activeUpdate.data.userId,
      metadata: { isActive: activeUpdate.data.isActive === "true" },
    });

    throw event.redirect(302, "/admin/users?updated=active");
  }

  throw event.redirect(302, "/admin/users?error=invalid-action");
});

export default component$(() => {
  const loader = useUsersLoader();
  const action = useUsersAction();

  return (
    <AppShell isAdmin={loader.value.isAdmin}>
      <section class="surface p-6 reveal">
        <h1 class="text-xl font-semibold">User management</h1>
        <p class="muted mt-1 text-sm">Manage roles and account activation flags.</p>

        {action.value?.error ? <p class="notice notice-error mt-4">{action.value.error}</p> : null}

        <div class="mt-5 overflow-auto">
          <table class="data-table min-w-[760px] text-sm">
            <thead>
              <tr>
                <th class="pb-2 font-medium">Name</th>
                <th class="pb-2 font-medium">Email</th>
                <th class="pb-2 font-medium">Role</th>
                <th class="pb-2 font-medium">Status</th>
                <th class="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loader.value.users.map((user) => (
                <tr key={user.id} class="align-top">
                  <td class="py-3">{user.name}</td>
                  <td class="table-cell-subtle py-3">{user.email}</td>
                  <td class="table-cell-subtle py-3">{user.role}</td>
                  <td class="table-cell-subtle py-3">{user.isActive ? "active" : "disabled"}</td>
                  <td class="py-3">
                    <div class="flex flex-col gap-2 sm:flex-row">
                      <Form action={action} class="flex items-center gap-2">
                        <input name="intent" type="hidden" value="set-role" />
                        <input name="userId" type="hidden" value={user.id} />
                        <select class="select h-9" name="role" value={user.role}>
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button class="btn btn-secondary h-9" type="submit">
                          Save
                        </button>
                      </Form>

                      <Form action={action}>
                        <input name="intent" type="hidden" value="set-active" />
                        <input name="userId" type="hidden" value={user.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={user.isActive ? "false" : "true"}
                        />
                        <button
                          class={`btn h-9 ${user.isActive ? "btn-danger" : "btn-secondary"}`}
                          type="submit"
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
});

export const head = {
  title: "Admin users | website-template",
};
