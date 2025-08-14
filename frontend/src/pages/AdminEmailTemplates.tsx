import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchEmailTemplates } from "../api/admin";

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<Record<string,string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEmailTemplates()
      .then(data => setTemplates(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h2>Email Templates</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : templates ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {Object.entries(templates).map(([name, content]) => (
            <div className="card" key={name}>
              <h4>{name}</h4>
              <div className="templates-list">{content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>No templates found</div>
      )}
    </AdminLayout>
  );
}
