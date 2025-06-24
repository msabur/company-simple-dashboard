import { makeAutoObservable } from "mobx";

export interface User {
  email: string;
  full_name: string;
  username: string;
  phone_number?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  date_of_birth?: string;

  picture_url: string;
  is_google_user: boolean;
  organization?: string;
  roles: string[];
}

class AuthStore {
  _user: User | null = null;
  _token: string | null = null;

  constructor() {
    makeAutoObservable(this);
    const token: string | null = localStorage.getItem("token");
    const userJson: string | null = localStorage.getItem("user")
    if (token) {
      this._token = token;
    }
    if (userJson) {
      try {
        this._user = JSON.parse(userJson);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        this._user = null;
      }
    }
  }

  set token(token: string) {
    this._token = token;
    localStorage.setItem("token", token);
  }

  get token(): string | null {
    return this._token;
  }

  set user(user: User | null) {
    localStorage.setItem("user", JSON.stringify(user));
    this._user = user;
  }

  get user(): User | null {
    return this._user;
  }

  logout() {
    this._token = null;
    this.user = null;
    localStorage.removeItem("token");
  }
}

export const authStore = new AuthStore();
