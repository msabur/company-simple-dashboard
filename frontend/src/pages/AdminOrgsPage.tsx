import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchAdminOrgs, type AdminOrg, deleteAdminOrg, updateAdminOrg, fetchAdminOrgMembers, type AdminOrgMember } from "../api/admin";

function EditOrgModal({ org, onSave, onClose }: { org: AdminOrg, onSave: (data: Partial<AdminOrg>) => void, onClose: () => void }) {
  const [name, setName] = useState(org.name);
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <h3>Edit Organization</h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button admin-button-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-button admin-button-primary" onClick={() => onSave({ name })}>Save</button>
        </div>
      </div>
    </div>
  );
}

function MembersModal({ org, onClose }: { org: AdminOrg, onClose: () => void }) {
  const [members, setMembers] = useState<AdminOrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    fetchAdminOrgMembers(org.id)
      .then(setMembers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [org.id]);
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <h3>Members of {org.name}</h3>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.user_id}</td>
                  <td>{m.user?.username || "-"}</td>
                  <td>{m.user?.email || "-"}</td>
                  <td>{m.roles.join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="admin-modal-footer">
          <button className="admin-button admin-button-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState<AdminOrg | null>(null);
  const [confirm, setConfirm] = useState<AdminOrg | null>(null);
  const [membersOrg, setMembersOrg] = useState<AdminOrg | null>(null);

  const reload = () => {
    setLoading(true);
    fetchAdminOrgs()
      .then(setOrgs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const handleEdit = (org: AdminOrg) => setEditOrg(org);
  const handleDelete = (org: AdminOrg) => setConfirm(org);
  const handleViewMembers = (org: AdminOrg) => setMembersOrg(org);

  const doEdit = async (data: Partial<AdminOrg>) => {
    if (!editOrg) return;
    try {
      await updateAdminOrg(editOrg.id, data);
      setEditOrg(null);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to update organization");
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    try {
      await deleteAdminOrg(confirm.id);
      setConfirm(null);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to delete organization");
    }
  };

  return (
    <AdminLayout>
      <h2>Organization Management</h2>
      {loading ? (
        <div>Loading organizations...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner (User ID)</th>
              <th>Created At</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>{o.created_by_user_id}</td>
                <td>{o.created_at?.slice(0, 19).replace("T", " ")}</td>
                <td>{o.member_count}</td>
                <td>
                  <button className="admin-button" onClick={() => handleEdit(o)}>Edit</button>
                  <button className="admin-button admin-button-danger" onClick={() => handleDelete(o)}>Delete</button>
                  <button className="admin-button" onClick={() => handleViewMembers(o)}>Members</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editOrg && (
        <EditOrgModal org={editOrg} onSave={doEdit} onClose={() => setEditOrg(null)} />
      )}

      {confirm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete organization '{confirm.name}'?</p>
            <div className="admin-modal-footer">
              <button className="admin-button admin-button-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="admin-button admin-button-danger" onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {membersOrg && (
        <MembersModal org={membersOrg} onClose={() => setMembersOrg(null)} />
      )}
    </AdminLayout>
  );
}
