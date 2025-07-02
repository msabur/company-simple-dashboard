import { authStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function getMyOrganizations() {
  const res = await fetch(`${BASE_URL}/organizations/me`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch organizations");
  }
  return data;
}

export async function createOrganization({ name }: { name: string }) {
  const res = await fetch(`${BASE_URL}/organizations/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to create organization");
  }
  return data;
}

export async function joinOrganization(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to join organization");
  }
  return data;
}

export async function getOrganizationMembers(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch members");
  }
  return data;
}

export async function updateMemberRole(orgId: number, userId: number, role: string) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to update role");
  }
  return data;
}

export async function updateMemberRoles(orgId: number, userId: number, roles: string[]) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({ roles }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to update roles");
  }
  return data;
}

export async function removeMember(orgId: number, userId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to remove member");
  }
  return data;
}

export async function getJoinableOrganizations() {
  const res = await fetch(`${BASE_URL}/organizations/?include_mine=false`, {
    headers: { Authorization: `Bearer ${authStore.token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch joinable organizations");
  }
  return data;
}

export async function leaveOrganization(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to leave organization");
  }
  return data;
}

export async function listOrgInvites(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/invites`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch invites");
  }
  return data;
}

export async function createOrgInvite(orgId: number, dataInput: { target_username?: string; max_uses?: number; expires_at?: string | null }) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify(dataInput),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to create invite");
  }
  return data;
}

export async function revokeOrgInvite(orgId: number, inviteId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/invites/${inviteId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to revoke invite");
  }
  return data;
}

export async function listUserInvites() {
  const res = await fetch(`${BASE_URL}/organizations/me/invites`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch user invites");
  }
  return data;
}

export async function acceptInvite(code: string) {
  const res = await fetch(`${BASE_URL}/organizations/invites/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to accept invite");
  }
  return data;
}