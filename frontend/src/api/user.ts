const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function signup({ email, full_name, username, password }: { email: string; full_name: string; username: string; password: string }) {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name, username, password })
    });
    if (!res.ok) throw new Error("Signup failed");
    return res.json();
}

export async function login({ email, password }: { email: string; password: string }) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
}

export async function googleAuth({ token }: { token: string }) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });
    if (!res.ok) throw new Error("Google auth failed");
    return res.json();
}

// GitHub OAuth: exchange code for token
export async function githubAuth({ code }: { code: string }) {
    const res = await fetch(`${BASE_URL}/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error("GitHub auth failed");
    return res.json();
}

export async function checkEmail(email: string): Promise<{ exists: boolean; isSocialUser: boolean }> {
    const res = await fetch(`${BASE_URL}/check-email?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to check email");
    return res.json();
}

export async function changePassword({ old_password, new_password }: { old_password: string; new_password: string }) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ old_password, new_password })
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error(errorData);
        throw new Error(`Failed to change password: status ${res.status}`);
    }
    return res.json();
}

export async function updateInfo({ full_name, email, phone_number, gender, timezone, date_of_birth, language }: {
    full_name: string,
    email: string,
    phone_number: string,
    gender: string,
    timezone: string,
    date_of_birth: string,
    language: string
}) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/update-info`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ full_name, email, phone_number, gender, timezone, date_of_birth, language })
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error(errorData);
        throw new Error(`Failed to update info: status ${res.status}`);
    }
    return res.json();
}
