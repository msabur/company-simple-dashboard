import { useState, useEffect, type JSX } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "../store/authStore";
import { Link } from "wouter";
import "./HomePage.css";
import logo from "/logo.png";
import { changePassword, updateInfo } from "../api/user";
import {
  getMyOrganizations,
  createOrganization,
  joinOrganization,
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
  getJoinableOrganizations,
  leaveOrganization,
} from "../api/org";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/></svg>
  ) },
  { key: "profile", label: "Profile", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/></svg>
  ) },
  { key: "security", label: "Security", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ) },
  { key: "linked", label: "Linked Accounts", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10"/><path d="M8 12h8"/></svg>
  ) },
  { key: "orgs", label: "Organizations", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
  ) },
  { key: "users", label: "Users", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2"/><path d="M17.5 21v-2a4.5 4.5 0 0 0-9 0v2"/></svg>
  ) },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "pt", label: "Portuguese" },
  { value: "hi", label: "Hindi" },
  // ...add more as needed
];

const TIMEZONES = [
  { value: "UTC-12:00", label: "UTC-12:00" },
  { value: "UTC-11:00", label: "UTC-11:00" },
  { value: "UTC-10:00", label: "UTC-10:00" },
  { value: "UTC-09:00", label: "UTC-09:00" },
  { value: "UTC-08:00", label: "UTC-08:00 (Pacific Time)" },
  { value: "UTC-07:00", label: "UTC-07:00 (Mountain Time)" },
  { value: "UTC-06:00", label: "UTC-06:00 (Central Time)" },
  { value: "UTC-05:00", label: "UTC-05:00 (Eastern Time)" },
  { value: "UTC+00:00", label: "UTC+00:00 (London)" },
  { value: "UTC+01:00", label: "UTC+01:00 (Berlin, Paris)" },
  { value: "UTC+03:00", label: "UTC+03:00 (Moscow)" },
  { value: "UTC+05:30", label: "UTC+05:30 (India)" },
  { value: "UTC+08:00", label: "UTC+08:00 (China)" },
  { value: "UTC+09:00", label: "UTC+09:00 (Japan)" },
  { value: "UTC+10:00", label: "UTC+10:00 (Sydney)" },
  // ...add more as needed
];

function DashboardTab({ setTab }: { setTab: (tab: string) => void }) {
  const pictureUrl = authStore.user?.picture_url;
  return (
    <div className="tab-content dashboard-tab">
      <div className="dashboard-cards">
        <div className="dashboard-card user-info-card">
          <div className="user-info-avatar">
            {pictureUrl ? (
              <img className="user-avatar" src={pictureUrl} alt="User avatar" />
            ) : (
              <span>{authStore.user?.full_name?.[0]}</span>
            )}
          </div>
          <div className="user-info-name">{authStore.user?.full_name}</div>
          <div className="user-info-email">{authStore.user?.email}</div>
        </div>
        <div className="dashboard-card dashboard-link-card" onClick={() => setTab("security")}> 
          <h3>
            <span className="dashboard-card-icon">
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            Account Security
          </h3>
          <p>Manage your security settings</p>
        </div>
        <div className="dashboard-card dashboard-link-card" onClick={() => setTab("profile")}> 
          <h3>
            <span className="dashboard-card-icon">
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/></svg>
            </span>
            Contact Info
          </h3>
          <p>View and update your contact details</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const user = authStore.user;
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [language, setLanguage] = useState(user?.language || "");
  const [timezone, setTimezone] = useState(user?.timezone || "");
  const [dob, setDob] = useState(user?.date_of_birth || "");
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const isGoogleUser = user?.is_google_user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    try {
      const res = await updateInfo({
        full_name: fullName, email, phone_number: phone, gender, timezone, date_of_birth: dob, language
      });
      setMessage("Profile updated successfully!");
      authStore.user = res.user;
    } catch (err: any) {
      console.log(err)
      setMessage(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content profile-tab">
      <h3>Edit Profile</h3>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-form-col">
          <label htmlFor="profile-fullname">Full Name</label>
          <input id="profile-fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />

          <label htmlFor="profile-phone">Phone Number</label>
          <input id="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +1 555 123 4567" />

          <label htmlFor="profile-gender">Gender</label>
          <select id="profile-gender" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Select gender</option>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>

          <label htmlFor="profile-dob">Date of Birth</label>
          <input id="profile-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div className="profile-form-col">
          <label htmlFor="profile-email">Email Address</label>
          <input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" disabled={isGoogleUser} />
          {isGoogleUser && (
            <div className="google-user-hint" style={{marginBottom: '0.5rem'}}>You sign in with your Google account, so your email address cannot be changed here.</div>
          )}

          <label htmlFor="profile-language">Language</label>
          <select id="profile-language" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="">Select language</option>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>

          <label htmlFor="profile-timezone">Time Zone</label>
          <select id="profile-timezone" value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="">Select time zone</option>
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Save Changes"}
        </button>
      </form>
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

function SecurityTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isGoogleUser = authStore.user?.is_google_user;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setMessage("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="tab-content security-tab">
      <h3>Change Password</h3>
      {isGoogleUser && (
        <div className="google-user-hint">
          You sign in with your Google account, so you don't have a password with us. You may update your password in your Google Account settings.
        </div>
      )}
      <form className="password-change-form" onSubmit={handleSubmit}>
        <label htmlFor="oldPassword">Current Password</label>
        <input type="password" id="oldPassword" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={isGoogleUser} />
        <label htmlFor="newPassword">New Password</label>
        <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={isGoogleUser} />
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isGoogleUser} />
        <button type="submit" disabled={isGoogleUser || loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

function LinkedTab() {
  return <div className="tab-content">Linked accounts go here.</div>;
}

function OrgsTab() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinDropdown, setShowJoinDropdown] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [joinableOrgs, setJoinableOrgs] = useState<any[]>([]);
  const [selectedJoinOrgId, setSelectedJoinOrgId] = useState("");
  const [message, setMessage] = useState("");
  const [pendingLeave, setPendingLeave] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const fetchOrgs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyOrganizations();
      setOrgs(data);
    } catch (e: any) {
      setError(e.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinableOrgs = async () => {
    try {
      const data = await getJoinableOrganizations();
      setJoinableOrgs(data);
    } catch (e: any) {
      setJoinableOrgs([]);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (showJoinDropdown) fetchJoinableOrgs();
  }, [showJoinDropdown]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await createOrganization({ name: newOrgName });
      setShowCreate(false);
      setNewOrgName("");
      fetchOrgs();
      setMessage("Organization created!");
    } catch (e: any) {
      setMessage(e.message || "Failed to create organization");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await joinOrganization(Number(selectedJoinOrgId));
      setMessage("Joined organization!");
      setSelectedJoinOrgId("");
      setShowJoinDropdown(false);
      await fetchOrgs();
      await fetchJoinableOrgs();
    } catch (e: any) {
      setMessage(e.message || "Failed to join organization");
    }
  };

  const handleLeave = async (orgId: number) => {
    setMessage("");
    if (pendingLeave.has(orgId)) {
      try {
        await leaveOrganization(orgId);
        await fetchOrgs();
        await fetchJoinableOrgs();
        setMessage("Left organization!");
      } catch (e: any) {
        setMessage(e.message || "Failed to leave organization");
      } finally {
        setPendingLeave(prev => {
          const newSet = new Set(prev);
          newSet.delete(orgId);
          return newSet;
        });
      }
    } else {
      setPendingLeave(prev => new Set(prev).add(orgId));
      setTimeout(() => {
        setPendingLeave(prev => {
          const newSet = new Set(prev);
          newSet.delete(orgId);
          if (newSet.size == 0) {
            setMessage("");
          }
          return newSet;
        });
      }, 5000); // Reset after 5 seconds
      setMessage("Click again to confirm leaving the organization.");
    }
  };

  // Filter orgs by search term
  const filteredOrgs = orgs.filter((org: any) =>
    search.trim() === "" || org.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="tab-content orgs-tab">
      <h3>Organizations & Roles</h3>
      <input
        className="orgs-input"
        type="text"
        placeholder="Search organizations by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="form-status-message error-message">{error}</div>
      ) : filteredOrgs.length === 0 ? (
        <div>No organizations found.</div>
      ) : (
        <ul className="orgs-list">
          {filteredOrgs.map((org: any) => (
            <li key={org.id}>
              <div>
                <b>{org.name}</b> <span className="orgs-role-label">({org.user_role})</span>
              </div>
              { org.user_role !== "admin" && (
                <button className="org-btn org-btn-danger" onClick={() => handleLeave(Number(org.id))} type="button">
                  {pendingLeave.has(org.id) ? "Sure?" : "Leave Organization"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="orgs-actions-row">
        <button className="org-btn" onClick={() => setShowJoinDropdown(v => !v)}>{showJoinDropdown ? "Cancel" : "Join an Organization"}</button>
        <button className="org-btn" onClick={() => setShowCreate(v => !v)}>{showCreate ? "Cancel" : "Create New Organization"}</button>
      </div>
      {showJoinDropdown && (
        <div className="orgs-join-dropdown">
          {joinableOrgs.length === 0 ? (
            <div className="orgs-empty-label">No organizations available to join.</div>
          ) : (
            <form onSubmit={handleJoin} className="orgs-join-form">
              <select
                className="orgs-dropdown"
                value={selectedJoinOrgId}
                onChange={e => setSelectedJoinOrgId(e.target.value)}
                required
              >
                <option value="">Select organization to join</option>
                {joinableOrgs.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
              <button className="org-btn" type="submit" disabled={!selectedJoinOrgId}>Join</button>
            </form>
          )}
        </div>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="orgs-create-form">
          <input type="text" className="orgs-input" placeholder="Organization Name" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} required />
          <button className="org-btn" type="submit">Create</button>
        </form>
      )}
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

function UsersTab() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyOrganizations().then(setOrgs).catch(() => setOrgs([]));
  }, []);

  const fetchMembers = async (orgId: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrganizationMembers(orgId);
      console.log("members", data);
      console.log(data.map((m: any) => (
        `${m.user.username} === ${authStore.user?.username} is ${m.user.username === authStore.user?.username}`
      )))
      setMembers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) fetchMembers(selectedOrg.id);
  }, [selectedOrg]);

  const handleRoleChange = async (userId: number, role: string) => {
    if (!selectedOrg) return;
    try {
      await updateMemberRole(selectedOrg.id, userId, role);
      fetchMembers(selectedOrg.id);
      setMessage("Role updated");
    } catch (e: any) {
      setMessage(e.message || "Failed to update role");
    }
  };

  const handleKick = async (userId: number) => {
    if (!selectedOrg) return;
    try {
      await removeMember(selectedOrg.id, userId);
      fetchMembers(selectedOrg.id);
      setMessage("User removed");
    } catch (e: any) {
      setMessage(e.message || "Failed to remove user");
    }
  };

  return (
    <div className="tab-content orgs-tab">
      <h3>Users</h3>
      <div className="users-org-select-row">
        <select className="users-dropdown" value={selectedOrg?.id || ""} onChange={e => {
          const org = orgs.find((o: any) => o.id === Number(e.target.value));
          setSelectedOrg(org);
        }}>
          <option value="">Select organization</option>
          {orgs.map((org: any) => (
            <option key={org.id} value={org.id}>{org.name} ({org.user_role})</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading members...</div>
      ) : error ? (
        <div className="form-status-message error-message">{error}</div>
      ) : selectedOrg && members.length === 0 ? (
        <div>No members in this organization.</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => {
              const isMe = m.user.username === authStore.user?.username;
              return (
                <tr key={m.user_id}>
                  <td>
                    <div><b>{m.user?.full_name || m.user_id}</b>{isMe && <span className="users-me-label">, me</span>}</div>
                    <div style={{ color: "#64748b", fontSize: ".97em" }}>{m.user?.username}</div>
                  </td>
                  <td>{m.user?.email}</td>
                  <td>
                    <span style={{ color: "#64748b", fontSize: ".97em" }}>({m.role})</span>
                    {selectedOrg?.user_role === "admin" && (
                      <span className="users-actions-row" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginLeft: 8, gap: 4 }}>
                        <select className="users-role-select" value={m.role} onChange={e => handleRoleChange(m.user_id, e.target.value)} disabled={isMe}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        {!isMe && m.role !== "admin" && (
                          <button className="org-btn org-btn-danger" onClick={() => handleKick(m.user_id)} type="button" style={{ marginTop: 4 }}>Kick</button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

const TAB_COMPONENTS: Record<string, (props: { setTab: (tab: string) => void }) => JSX.Element> = {
  dashboard: DashboardTab,
  profile: () => <ProfileTab />, 
  security: () => <SecurityTab />, 
  linked: () => <LinkedTab />, 
  orgs: () => <OrgsTab />, 
  users: () => <UsersTab />,
};

export const HomePage = observer(() => {
  const [tab, setTab] = useState("dashboard");
  const TabComponent = TAB_COMPONENTS[tab];
  if (!authStore.user) {
    return (
      <div className="home-page">
        <h1>Welcome to the product!</h1>
        <p>Please <Link href="/auth">Log in or Sign up</Link>.</p>
      </div>
    );
  }
  return (
    <div className="home-layout">
      <aside className="tab-sidebar">
        <div className="sidebar-logo-container">
          <img src={logo} alt="Logo" className="sidebar-logo" />
        </div>
        {TABS.map(t => (
          <button
            key={t.key}
            className={"tab-btn" + (tab === t.key ? " active" : "")}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </aside>
      <section className="tab-main">
        <TabComponent setTab={setTab} />
      </section>
    </div>
  );
});
