import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchAdminUsers, fetchAdminOrgs, fetchTopOrgs } from "../api/admin";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [topOrgs, setTopOrgs] = useState<{id:number,name:string,member_count:number}[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAdminUsers(), fetchAdminOrgs()])
      .then(([users, orgs]) => {
        setUserCount(users.length);
        setOrgCount(orgs.length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    fetchTopOrgs().then(setTopOrgs).catch(() => setTopOrgs([]));
  }, []);

  return (
    <AdminLayout>
      <h2>Overview</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div>
          <div className="admin-grid">
            <div className="card">
              <div className="stat">{userCount}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="card">
              <div className="stat">{orgCount}</div>
              <div className="stat-label">Organizations</div>
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Top Organizations</h3>
          <div className="card">
            {Array.isArray(topOrgs) && topOrgs.length > 0 ? (
              <ol style={{ margin: 0 }}>
                {topOrgs.map(o => (
                  <li key={o.id}>{o.name} — {o.member_count} members</li>
                ))}
              </ol>
            ) : (
              <div>No data</div>
            )}
          </div>

          <h3 style={{ marginTop: 20 }}>Email Templates</h3>
          <div className="card">
            <a href="/admin/email-templates">View templates</a>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
