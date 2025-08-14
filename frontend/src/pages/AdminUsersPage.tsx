import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchAdminUsers, type AdminUser, updateAdminUser, deleteAdminUser, sendPasswordResetEmail } from "../api/admin";

function EditUserModal({ user, onSave, onClose }: { user: AdminUser, onSave: (data: Partial<AdminUser>) => void, onClose: () => void }) {
  const [phone, setPhone] = useState(user.phone_number || "");
  const [lang, setLang] = useState(user.language || "");
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <h3>Edit User</h3>
        <div className="admin-form-group">
          <label>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label>Language</label>
          <input value={lang} onChange={e => setLang(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label><input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} /> Administrator</label>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button admin-button-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-button admin-button-primary" onClick={() => onSave({ phone_number: phone, language: lang, is_admin: isAdmin })}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{ user: AdminUser, action: "delete" | "reset" } | null>(null);

  const reload = () => {
    setLoading(true);
    fetchAdminUsers()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const handleEdit = (user: AdminUser) => setEditUser(user);
  const handleDelete = (user: AdminUser) => setConfirm({ user, action: "delete" });
  const handleResetPassword = (user: AdminUser) => setConfirm({ user, action: "reset" });

  const doEdit = async (data: Partial<AdminUser>) => {
    if (!editUser) return;
    try {
      await updateAdminUser(editUser.id, data);
      setEditUser(null);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to update user");
    }
  };

  const doConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.action === "delete") {
        await deleteAdminUser(confirm.user.id);
      } else {
        await sendPasswordResetEmail(confirm.user.email);
        alert("Password reset email sent.");
      }
      setConfirm(null);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed");
    }
  };

  return (
    <AdminLayout>
      <h2>User Management</h2>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Created At</th>
              <th>Phone</th>
              <th>Language</th>
              <th>Admin</th>
              <th>Linked Accounts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td title={u.email}>{u.email}</td>
                <td title={u.username}>{u.username}</td>
                <td title={u.created_at}>{u.created_at?.slice(0, 10) || "-"}</td>
                <td className="phone" title={u.phone_number || "-"}>{u.phone_number || "-"}</td>
                <td title={u.language || "-"}>{u.language || "-"}</td>
                <td>{u.is_admin ? "Yes" : "No"}</td>
                <td title={u.linked_accounts?.map(a => a.provider).join(", ") || "-"}>{u.linked_accounts?.map(a => a.provider).join(", ") || "-"}</td>
                <td className="actions">
                  <button className="admin-button" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="admin-button admin-button-danger" onClick={() => handleDelete(u)}>Delete</button>
                  { (u.linked_accounts?.length ?? 0) === 0 && (
                    <button className="admin-button" onClick={() => handleResetPassword(u)}>Reset</button>
                  ) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editUser && (
        <EditUserModal user={editUser} onSave={doEdit} onClose={() => setEditUser(null)} />
      )}

      {confirm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>{confirm.action === "delete" ? "Delete User" : "Reset Password"}</h3>
            <p>
              {confirm.action === "delete"
                ? `Are you sure you want to delete user '${confirm.user.email}'? This action cannot be undone.`
                : `Are you sure you want to reset password for '${confirm.user.email}'?`}
            </p>
            <div className="admin-modal-footer">
              <button className="admin-button admin-button-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button className={`admin-button ${confirm.action === "delete" ? "admin-button-danger" : "admin-button-primary"}`} onClick={doConfirm}>
                {confirm.action === "delete" ? "Delete User" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
