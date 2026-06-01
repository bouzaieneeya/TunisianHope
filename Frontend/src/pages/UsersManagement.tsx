import { FormEvent, ReactNode, useState } from "react";
import { Navigate } from "react-router-dom";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { useApp } from "@/context/AppContext";
import { backendApi } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type NewUserForm = {
  username: string;
  password: string;
  role: "operator" | "supervisor" | "admin";
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  center: string;
};

type ManagedUser = {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  center: string;
  is_active: boolean;
};

type EditUserForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  center: string;
  role: "operator" | "supervisor" | "admin";
  password: string;
};

const initialForm: NewUserForm = {
  username: "",
  password: "",
  role: "operator",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  center: "",
};

export default function UsersManagement() {
  const { currentUser } = useApp();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewUserForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users-management-list"],
    queryFn: () => backendApi.usersList(),
    enabled: currentUser.role === "Admin",
  });

  if (currentUser.role !== "Admin") return <Navigate to="/dashboard" replace />;

  const users = (data ?? []) as ManagedUser[];

  const submitCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await backendApi.usersCreate({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        center: form.center.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["users-management-list"] });
      toast.success("User created");
      setForm(initialForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizeRoleForBackend = (role: string): "operator" | "supervisor" | "admin" => {
    const normalized = role.toLowerCase();
    if (normalized === "admin") return "admin";
    if (normalized === "counselor") return "supervisor";
    return "operator";
  };

  const openEdit = (user: ManagedUser) => {
    const [firstName = "", ...lastParts] = (user.name ?? "").split(" ");
    setEditingUserId(user.id);
    setEditForm({
      first_name: firstName,
      last_name: lastParts.join(" "),
      email: user.email ?? "",
      phone: user.phone ?? "",
      center: user.center ?? "",
      role: normalizeRoleForBackend(user.role),
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm(null);
  };

  const submitEdit = async () => {
    if (!editingUserId || !editForm) return;
    setSavingEdit(true);
    try {
      await backendApi.usersUpdate(editingUserId, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        center: editForm.center.trim(),
        role: editForm.role,
        ...(editForm.password.trim() ? { password: editForm.password } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["users-management-list"] });
      toast.success("User updated");
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (user: ManagedUser) => {
    setTogglingUserId(user.id);
    try {
      await backendApi.usersToggleActive(user.id, !user.is_active);
      await queryClient.invalidateQueries({ queryKey: ["users-management-list"] });
      toast.success(user.is_active ? "User deactivated" : "User activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change user status");
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Users Management">
        <form onSubmit={submitCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Username">
            <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" required />
          </Field>
          <Field label="Password">
            <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" required />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as NewUserForm["role"] }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full">
              <option value="operator">Operator</option>
              <option value="supervisor">Counselor (supervisor)</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="First name">
            <input value={form.first_name} onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
          </Field>
          <Field label="Last name">
            <input value={form.last_name} onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
          </Field>
          <Field label="Center">
            <input value={form.center} onChange={(e) => setForm((s) => ({ ...s, center: e.target.value }))} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
          </Field>
          <div className="md:col-span-3">
            <button disabled={submitting} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60">
              {submitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Users List">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : isError ? (
          <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load users."}</p>
        ) : users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {["Username", "Name", "Role", "Email", "Phone", "Center", "Active"].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                  ))}
                  <th className="text-left font-medium px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2 font-mono text-xs">{user.username}</td>
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">{user.role}</td>
                    <td className="px-3 py-2 text-muted-foreground">{user.email || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{user.phone || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{user.center || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{user.is_active ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(user)} className="h-8 px-2 text-xs border border-border rounded hover:bg-muted">Edit</button>
                        <button
                          onClick={() => void toggleActive(user)}
                          disabled={togglingUserId === user.id}
                          className="h-8 px-2 text-xs border border-border rounded hover:bg-muted disabled:opacity-60"
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editingUserId && editForm && (
        <Panel title={`Edit user #${editingUserId}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="First name">
              <input value={editForm.first_name} onChange={(e) => setEditForm((s) => s ? { ...s, first_name: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <Field label="Last name">
              <input value={editForm.last_name} onChange={(e) => setEditForm((s) => s ? { ...s, last_name: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <Field label="Role">
              <select value={editForm.role} onChange={(e) => setEditForm((s) => s ? { ...s, role: e.target.value as EditUserForm["role"] } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full">
                <option value="operator">Operator</option>
                <option value="supervisor">Counselor (supervisor)</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Email">
              <input value={editForm.email} onChange={(e) => setEditForm((s) => s ? { ...s, email: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <Field label="Phone">
              <input value={editForm.phone} onChange={(e) => setEditForm((s) => s ? { ...s, phone: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <Field label="Center">
              <input value={editForm.center} onChange={(e) => setEditForm((s) => s ? { ...s, center: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <Field label="New password (optional)">
              <input type="password" value={editForm.password} onChange={(e) => setEditForm((s) => s ? { ...s, password: e.target.value } : s)} className="h-9 px-3 text-sm border border-border rounded-md bg-background w-full" />
            </Field>
            <div className="md:col-span-3 flex gap-2">
              <button onClick={() => void submitEdit()} disabled={savingEdit} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60">{savingEdit ? "Saving..." : "Save changes"}</button>
              <button onClick={cancelEdit} className="h-9 px-4 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
