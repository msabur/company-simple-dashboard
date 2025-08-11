import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { fetchAdminUsers, type AdminUser, updateAdminUser, deleteAdminUser, resetAdminUserPassword } from "../api/admin";

function EditUserModal({ user, onSave, onClose }: { user: AdminUser, onSave: (data: Partial<AdminUser>) => void, onClose: () => void }) {
  const [phone, setPhone] = useState(user.phone_number || "");
  const [lang, setLang] = useState(user.language || "");
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit User</h3>
        <label>Phone: <input value={phone} onChange={e => setPhone(e.target.value)} /></label><br />
        <label>Language: <input value={lang} onChange={e => setLang(e.target.value)} /></label><br />
        <label><input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} /> Admin</label><br />
        <div style={{ marginTop: 12 }}>
          <button onClick={() => onSave({ phone_number: phone, language: lang, is_admin: isAdmin })}>Save</button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
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
        await resetAdminUserPassword(confirm.user.id);
        alert("Password reset link sent or password reset");
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
        <table>
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
                <td>{u.email}</td>
                <td>{u.username}</td>
                <td>{u.created_at?.slice(0, 19).replace("T", " ")}</td>
                <td>{u.phone_number || "-"}</td>
                <td>{u.language || "-"}</td>
                <td>{u.is_admin ? "Yes" : "No"}</td>
                <td>{u.linked_accounts?.map(a => a.provider).join(", ") || "-"}</td>
                <td>
                  <button onClick={() => handleEdit(u)}>Edit</button>{" "}
                  <button onClick={() => handleDelete(u)} style={{ color: "red" }}>Delete</button>{" "}
                  <button onClick={() => handleResetPassword(u)}>Reset Password</button>
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
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirm.action === "delete" ? "Delete" : "Reset Password"}</h3>
            <p>
              Are you sure you want to {confirm.action === "delete" 
                ? `delete user '${confirm.user.email}'? This action cannot be undone.` 
                : `reset password for '${confirm.user.email}'? They will need to create a new password.`}
            </p>
            <div style={{ marginTop: 12 }}>
              <button onClick={doConfirm} style={{ marginRight: 8 }}>
                {confirm.action === "delete" ? "Delete User" : "Reset Password"}
              </button>
              <button onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal {
          background: white;
          padding: 20px;
          border-radius: 4px;
          min-width: 300px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          text-align: left;
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
      `}</style>
    </AdminLayout>
  );
}
