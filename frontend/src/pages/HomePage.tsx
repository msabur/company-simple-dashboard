import { useState, type JSX } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "../store/authStore";
import { Link } from "wouter";
import "./HomePage.css";
import logo from "/logo.png";
import { changePassword, updateInfo } from "../api/user";

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
  // Simulate org info for demo
  const org = authStore.user?.organization || null;
  const roles = authStore.user?.roles || [];
  return (
    <div className="tab-content orgs-tab">
      {org ? (
        <>
          <h3>Organization: {org}</h3>
          <div>User Roles:</div>
          <ul>
            {roles.length ? roles.map((r: string) => <li key={r}>{r}</li>) : <li>Member</li>}
          </ul>
        </>
      ) : (
        <>
          <div style={{marginBottom: "1.5rem"}}>
            <button className="org-btn">Join an Organization</button>
          </div>
        </>
      )}
      <button className="org-btn">Create New Organization</button>
    </div>
  );
}

const TAB_COMPONENTS: Record<string, (props: { setTab: (tab: string) => void }) => JSX.Element> = {
  dashboard: DashboardTab,
  profile: () => <ProfileTab />,
  security: () => <SecurityTab />,
  linked: () => <LinkedTab />,
  orgs: () => <OrgsTab />,
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
