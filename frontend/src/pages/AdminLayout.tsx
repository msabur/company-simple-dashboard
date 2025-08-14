import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";
import "./AdminLayout.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <nav className="admin-nav">
          <Link href="/admin" className={location === "/admin" ? "active" : ""}>
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className={location === "/admin/users" ? "active" : ""}
          >
            Users
          </Link>
          <Link
            href="/admin/orgs"
            className={location === "/admin/orgs" ? "active" : ""}
          >
            Organizations
          </Link>
          <Link
            href="/admin/email-templates"
            className={
              location === "/admin/email-templates" ? "active" : ""
            }
          >
            Templates
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
