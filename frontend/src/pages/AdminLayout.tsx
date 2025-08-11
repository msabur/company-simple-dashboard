import { Link } from "wouter";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav>
        <Link href="/admin">Dashboard</Link> | <Link href="/admin/users">Users</Link> | <Link href="/admin/orgs">Organizations</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
