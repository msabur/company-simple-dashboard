import { useState, useEffect, type JSX } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "../store/authStore";
import "./HomePage.css";
import { changePassword, updateInfo, listLinkedAccounts, linkAccount, unlinkAccount } from "../api/user";
import {
  getMyOrganizations,
  createOrganization,
  joinOrganization,
  getOrganizationMembers,
  // updateMemberRole,
  removeMember,
  getJoinableOrganizations,
  leaveOrganization,
} from "../api/org";
import { updateMemberRoles } from "../api/org";
import { listUserInvites, acceptInvite } from "../api/org";
import { listOrgInvites, revokeOrgInvite } from "../api/org";
import { GoogleLogin } from "@react-oauth/google";

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
  { key: "invitations", label: "Invitations", icon: (
    <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/><path d="M12 15l3-3-3-3-3 3z"/></svg>
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
          <div className="user-info-username">{authStore.user?.username}</div>
          <div className="user-info-email">{authStore.user?.email}</div>
          {/* Admin panel link for admin users */}
          {authStore.user?.is_admin && (
            <div style={{ marginTop: "1em" }}>
              <a href="/admin" className="admin-switch-link" style={{ color: "#2563eb", fontWeight: "bold" }}>
                Switch to Admin View
              </a>
            </div>
          )}
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
  const isSocialAccount = user?.auth_provider !== "local";

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
          <input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" disabled={isSocialAccount} />
          {isSocialAccount && (
            <div className="social-user-hint social-user-hint-margin">You sign in with a social account, so your email address cannot be changed here.</div>
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
  const isSocialAccount = authStore.user?.auth_provider !== "local";
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
      {isSocialAccount && (
        <div className="social-user-hint">
          You sign in with a social account, so you don't have a password with us. You may update your password in your Google Account settings.
        </div>
      )}
      <form className="password-change-form" onSubmit={handleSubmit}>
        <label htmlFor="oldPassword">Current Password</label>
        <input type="password" id="oldPassword" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={isSocialAccount} />
        <label htmlFor="newPassword">New Password</label>
        <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={isSocialAccount} />
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isSocialAccount} />
        <button type="submit" disabled={isSocialAccount || loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

function LinkedTab() {
  const [linked, setLinked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const fetchLinked = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listLinkedAccounts();
      setLinked(data);
    } catch (e: any) {
      setError(e.message || "Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinked(); }, []);

  const handleUnlink = async (provider: string, email: string) => {
    setUnlinking(provider + email);
    setMessage("");
    try {
      await unlinkAccount({ provider, email });
      setMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked.`);
      fetchLinked();
    } catch (e: any) {
      setMessage(e.message || "Failed to unlink account");
    } finally {
      setUnlinking(null);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setMessage("");
    if (credentialResponse.credential) {
      try {
        await linkAccount({ provider: "google", token: credentialResponse.credential });
        setMessage("Google account linked!");
        fetchLinked();
      } catch (err: any) {
        setMessage(err.message || "Failed to link Google account");
      }
    }
  };

  const handleGithubLink = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/github/callback/link`,
      scope: "read:user user:email"
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  return (
    <div className="tab-content linked-tab">
      <h3>Linked Accounts</h3>
      {loading ? <div>Loading...</div> : error ? <div className="form-status-message error-message">{error}</div> : (
        <div className="linked-accounts-list">
          {["google", "github"].map(provider => {
            const acc = linked.find(a => a.provider === provider);
            return (
              <div key={provider} className="linked-account-row">
                <span className="linked-provider-label">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                {acc ? (
                  <>
                    <span className="linked-email">: {acc.email}</span>
                    <button className="org-btn org-btn-danger" onClick={() => handleUnlink(provider, acc.email)} disabled={unlinking === provider + acc.email}>
                      {unlinking === provider + acc.email ? "Unlinking..." : "Unlink"}
                    </button>
                  </>
                ) : provider === "google" ? (
                  <GoogleLogin onSuccess={handleGoogleSuccess} text="continue_with" width={220} />
                ) : (
                  <button className="org-btn github-login-btn" onClick={handleGithubLink}>
                    <img src="/github.svg" alt="GitHub" width={20} height={20} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    Link GitHub
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
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
        if (e.status === 403 || e.message?.includes("403")) {
          setMessage("You cannot leave this organization because you have required roles (e.g., admin). Please transfer your roles or contact another admin.");
        } else {
          setMessage(e.message || "Failed to leave organization");
        }
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
          {filteredOrgs.map((org: any) => {
            const roles = Array.isArray(org.user_roles) ? org.user_roles : (org.user_roles ? [org.user_roles] : []);
            const isAdmin = roles.includes("admin");
            return (
              <li key={org.id}>
                <div>
                  <b>{org.name}</b> <span className="orgs-role-label">({roles.join(", ")})</span>
                </div>
                {isAdmin ? (
                  <button className="org-btn org-btn-danger" type="button" disabled title="Admins cannot leave the organization without transferring authority or removing the admin role.">
                    Leave Organization
                  </button>
                ) : (
                  <button className="org-btn org-btn-danger" onClick={() => handleLeave(Number(org.id))} type="button">
                    {pendingLeave.has(org.id) ? "Sure?" : "Leave Organization"}
                  </button>
                )}
              </li>
            );
          })}
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
  const [showInvites, setShowInvites] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [showNewInvite, setShowNewInvite] = useState(false);
  const [inviteTargetUser, setInviteTargetUser] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [inviteCreateMsg, setInviteCreateMsg] = useState("");

  useEffect(() => {
    getMyOrganizations()
      .then(orgsResult => {
        setOrgs(orgsResult);
        if (orgsResult?.length == 1) {
          setSelectedOrg(orgsResult[0])
        }
      })
      .catch(() => setOrgs([]));
  }, []);

  const fetchMembers = async (orgId: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrganizationMembers(orgId);
      setMembers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers(selectedOrg.id);
    } else {
      setMembers([]);
    }
  }, [selectedOrg]);

  const handleRolesChange = async (userId: number, roles: string[]) => {
    if (!selectedOrg) return;
    try {
      await updateMemberRoles(selectedOrg.id, userId, roles);
      fetchMembers(selectedOrg.id);
      setMessage("Roles updated");
    } catch (e: any) {
      setMessage(e.message || "Failed to update roles");
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

  const fetchInvites = async () => {
    if (!selectedOrg) return;
    setInviteLoading(true);
    setInviteError("");
    try {
      const data = await listOrgInvites(selectedOrg.id);
      setInvites(data);
    } catch (e: any) {
      setInviteError(e.message || "Failed to load invites");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteCreateMsg("");
    try {
      const payload: any = { max_uses: inviteMaxUses };
      if (inviteTargetUser) payload.target_username = inviteTargetUser;
      if (inviteExpiresAt) {
        // Convert local datetime-local string to ISO string with timezone
        const local = new Date(inviteExpiresAt);
        payload.expires_at = local.toISOString();
      }
      setInviteCreateMsg("Invite created!");
      fetchInvites();
      setInviteTargetUser("");
      setInviteExpiresAt("");
      setInviteMaxUses(1);
      setShowNewInvite(false);
    } catch (e: any) {
      setInviteCreateMsg(e.message || "Failed to create invite");
    }
  };

  const handleRevokeInvite = async (inviteId: number) => {
    if (!selectedOrg) return;
    try {
      await revokeOrgInvite(selectedOrg.id, inviteId);
      fetchInvites();
    } catch {}
  };

  // Find current user's roles in selected org
  const myOrgEntry = selectedOrg && Array.isArray(selectedOrg.user_roles) ? selectedOrg : orgs.find((o: any) => o.id === selectedOrg?.id);
  const myRoles = myOrgEntry && Array.isArray(myOrgEntry.user_roles) ? myOrgEntry.user_roles : [];
  const isAdmin = myRoles.includes("admin");

  return (
    <div className="tab-content orgs-tab">
      <h3>Users</h3>
      <div className="users-org-select-row">
        <select className="users-dropdown" value={selectedOrg?.id || ""} onChange={e => {
          const org = orgs.find((o: any) => o.id === Number(e.target.value));
          setSelectedOrg(org);
          fetchInvites();
        }}>
          <option value="">Select organization</option>
          {orgs.map((org: any) => (
            <option key={org.id} value={org.id}>{org.name} ({Array.isArray(org.user_roles) ? org.user_roles.join(", ") : org.user_roles || org.user_role})</option>
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
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => {
              const isMe = m.user.username === authStore.user?.username;
              const roles = Array.isArray(m.roles) ? m.roles : (m.roles ? [m.roles] : []);
              return (
                <tr key={m.user_id}>
                  <td>
                    <div><b>{m.user?.full_name || m.user_id}</b>{isMe && <span className="users-me-label">, me</span>}</div>
                    <div className="users-username">{m.user?.username}</div>
                  </td>
                  <td>{m.user?.email}</td>
                  <td>
                    <span className="users-role-label">
                      {roles.join(", ")}
                    </span>
                    {isAdmin && !isMe && (
                      <span className="users-actions-row">
                        <RoleCheckboxes
                          roles={roles}
                          onChange={roles => handleRolesChange(m.user_id, roles)}
                        />
                        {!roles.includes("admin") && (
                          <button className="org-btn org-btn-danger users-kick-btn" onClick={() => handleKick(m.user_id)} type="button">Kick</button>
                        )}
                      </span>
                    )}
                    {isMe && isAdmin && (
                      <span className="users-admin-self-edit-note" title="You cannot remove your own admin role here for safety."> (admin cannot self-edit)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {message && <div className="form-status-message">{message}</div>}
      {isAdmin && selectedOrg && (
        <div style={{ margin: '16px 0' }}>
          <button className="org-btn" onClick={() => { setShowInvites(v => !v); if (!showInvites) fetchInvites(); }}>
            {showInvites ? "Hide Invites" : "Manage Invites"}
          </button>
          {showInvites && (
            <div className="users-org-invites-panel">
              <h4>Organization Invites</h4>
              {inviteLoading ? <div>Loading...</div> : inviteError ? <div className="form-status-message error-message">{inviteError}</div> : (
                <ul style={{ marginBottom: 12 }}>
                  {invites.length === 0 ? <li>No invites</li> : invites.map(invite => (
                    <li key={invite.id} style={{ marginBottom: 6 }}>
                      <span style={{ fontFamily: 'monospace' }}>{invite.code}</span> (uses: {invite.uses}/{invite.max_uses})
                      {invite.expires_at && (
                        <span style={{ marginLeft: 8, color: '#64748b' }}>
                          Expires: <InviteExpiryCountdown expiresAt={invite.expires_at} />
                        </span>
                      )}
                      <button className="org-btn org-btn-danger" style={{ marginLeft: 8 }} onClick={() => handleRevokeInvite(invite.id)}>Revoke</button>
                      <button
                        type="button"
                        className="org-btn users-copy-link-btn"
                        onClick={() => navigator.clipboard.writeText(invite.code)}
                        title="Copy invite link"
                      >
                        Copy link
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button className="org-btn" onClick={() => setShowNewInvite(v => !v)}>{showNewInvite ? "Cancel" : "New Invite"}</button>
              {showNewInvite && (
                <form onSubmit={handleCreateInvite} className="users-new-invite-form">
                  <label>
                    Target username (leave blank for open invite):
                    <input type="text" value={inviteTargetUser} onChange={e => setInviteTargetUser(e.target.value)} placeholder="Target username (optional)" />
                  </label>
                  <label>
                    Max Uses:
                    <input type="number" min={1} value={inviteMaxUses} onChange={e => setInviteMaxUses(Number(e.target.value))} />
                  </label>
                  <label>
                    Expiration (optional):
                    <input type="datetime-local" value={inviteExpiresAt} onChange={e => setInviteExpiresAt(e.target.value)} />
                  </label>
                  <button className="org-btn" type="submit">Create Invite</button>
                  {inviteCreateMsg && <div className="form-status-message">{inviteCreateMsg}</div>}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleCheckboxes({ roles, onChange, disabled }: { roles: string[]; onChange: (roles: string[]) => void; disabled?: boolean }) {
  const [customRole, setCustomRole] = useState("");
  const ALL_DEFAULT_ROLES = ["member", "admin"];
  // All roles to show as checkboxes (default + any custom roles already assigned)
  const allRoles = Array.from(new Set([...ALL_DEFAULT_ROLES, ...roles]));

  const handleAddCustomRole = () => {
    const role = customRole.trim();
    if (role && !roles.includes(role)) {
      onChange([...roles, role]);
      setCustomRole("");
    }
  };

  return (
    <div className="role-checkboxes-wrapper">
      <div className="role-checkboxes-list">
        {allRoles.map(role => (
          <label key={role} className="role-checkbox-label">
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={e => {
                if (e.target.checked) {
                  onChange([...roles, role]);
                } else {
                  onChange(roles.filter(r => r !== role));
                }
              }}
              disabled={disabled}
            />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </label>
        ))}
      </div>
      {!disabled && (
        <div className="role-checkboxes-add-row">
          <input
            type="text"
            value={customRole}
            onChange={e => setCustomRole(e.target.value)}
            placeholder="Add custom role"
            className="role-checkboxes-add-input"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomRole();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomRole}
            disabled={!customRole.trim() || roles.includes(customRole.trim())}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export function InvitationsTab() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");

  const fetchInvites = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUserInvites();
      setInvites(data);
    } catch (e: any) {
      setError(e.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAccept = async (code: string) => {
    setMessage("");
    try {
      await acceptInvite(code);
      setMessage("Joined organization!");
      fetchInvites();
    } catch (e: any) {
      setMessage(e.message || "Failed to accept invite");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    handleAccept(inviteCode.trim());
    setInviteCode("");
  };

  return (
    <div className="tab-content invitations-tab">
      <h3>Invitations</h3>
      <form onSubmit={handleCodeSubmit} className="invitations-code-form">
        <input
          type="text"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
          className="invitations-code-input"
        />
        <button className="org-btn" type="submit" disabled={!inviteCode.trim()}>Accept</button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="form-status-message error-message">{error}</div>
      ) : invites.length === 0 ? (
        <div>No incoming invitations. If you have a code, you may enter it above.</div>
      ) : (
        <ul className="invites-list">
          {invites.map(invite => (
            <li key={invite.id} className="invites-list-item">
              <b>{invite.organization?.name || `Org #${invite.org_id}`}</b> <span className="invites-code">({invite.code})</span>
              <button className="org-btn invites-join-btn" onClick={() => handleAccept(invite.code)}>Join</button>
              {invite.expires_at && <span className="invites-expiry" title="Expires">Expires: {invite.expires_at.slice(0, 16).replace('T', ' ')}</span>}
            </li>
          ))}
        </ul>
      )}
      {message && <div className="form-status-message">{message}</div>}
    </div>
  );
}

function InviteExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    function updateCountdown() {
      const expiry = new Date(expiresAt);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        (hours > 0 ? `${hours}h ` : "") +
        (minutes > 0 ? `${minutes}m ` : "") +
        `${seconds}s`
      );
    }
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

const TAB_COMPONENTS: Record<string, (props: { setTab: (tab: string) => void }) => JSX.Element> = {
  dashboard: DashboardTab,
  profile: () => <ProfileTab />, 
  security: () => <SecurityTab />, 
  linked: () => <LinkedTab />, 
  orgs: () => <OrgsTab />, 
  users: () => <UsersTab />,
  invitations: () => <InvitationsTab />,
};

export const HomePage = observer(() => {
  const [tab, setTab] = useState("dashboard");
  const TabComponent = TAB_COMPONENTS[tab];
  return (
    <div className="home-layout">
      <aside className="tab-sidebar">
        <div className="sidebar-logo-container">
          <img alt="Logo" className="logo sidebar-logo" />
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
