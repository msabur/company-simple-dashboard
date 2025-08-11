const BASE_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  created_at: string;
  phone_number?: string;
  language?: string;
  is_admin: boolean;
  linked_accounts: { provider: string }[];
}

export interface AdminOrg {
  id: number;
  name: string;
  created_by_user_id: number;
  created_at: string;
  member_count: number;
}

export interface AdminOrgMember {
  id: number;
  user_id: number;
  roles: string[];
  user?: AdminUser;
}

export async function fetchAdminUsers() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminOrgs() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/organizations`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch organizations");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminOrgMembers(orgId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/organizations/${orgId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch organization");
  const data = await res.json();
  if (data && typeof data === "object" && Array.isArray(data.members)) {
    return data.members;
  }
  return [];
}

export async function deleteAdminOrg(orgId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/organizations/${orgId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete organization");
  return res.json();
}

export async function updateAdminOrg(orgId: number, data: Partial<AdminOrg>) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/organizations/${orgId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update organization");
  return res.json();
}

export async function updateAdminUser(userId: number, data: Partial<AdminUser>) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteAdminUser(userId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function resetAdminUserPassword(userId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ reset_password: true })
  });
  if (!res.ok) throw new Error("Failed to reset password");
  return res.json();
}
