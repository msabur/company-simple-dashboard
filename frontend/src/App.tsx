import { observer } from "mobx-react-lite";
import { useLocation, Link, Route, Switch } from "wouter";
import { GoogleOAuthProvider } from "@react-oauth/google";

import AuthPage from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { authStore } from "./store/authStore";

import "./index.css";

export default observer(function App() {
  const [, navigate] = useLocation();

  const handleLogout = () => {
    authStore.logout();
    navigate("/");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <div>
        <div className="nav-container">
          <nav className="navbar">
            {authStore.user ? (
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            ) : (
              <Link href="/auth">Log in or Sign up</Link>
            )}
          </nav>
        </div>
        <main>
          <Switch>
            <Route path="/auth">
              <AuthPage />
            </Route>
            <Route>
              <HomePage />
            </Route>
          </Switch>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
});