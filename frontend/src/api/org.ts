import { authStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function getMyOrganizations() {
  const res = await fetch(`${BASE_URL}/organizations/me`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch organizations");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to create organization");
  return res.json();
}

export async function joinOrganization(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  if (!res.ok) throw new Error("Failed to join organization");
  return res.json();
}

export async function getOrganizationMembers(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members`, {
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

export async function removeMember(orgId: number, userId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  if (!res.ok) throw new Error("Failed to remove member");
  return res.json();
}

export async function getJoinableOrganizations() {
  const res = await fetch(`${BASE_URL}/organizations/?include_mine=false`, {
    headers: { Authorization: `Bearer ${authStore.token}` }
  });
  if (!res.ok) {
    console.error(await res.json());
    throw new Error("Failed to fetch joinable organizations");
  }
  return res.json();
}

export async function leaveOrganization(orgId: number) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authStore.token}` },
  });
  if (!res.ok) throw new Error("Failed to leave organization");
  return res.json();
}