import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchAdminUsers, fetchAdminOrgs } from "../api/admin";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [orgCount, setOrgCount] = useState<number | null>(null);
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
  }, []);

  return (
    <AdminLayout>
      <h1>Admin Dashboard</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div>
          <p>Users: {userCount}</p>
          <p>Organizations: {orgCount}</p>
        </div>
      )}
    </AdminLayout>
  );
}
