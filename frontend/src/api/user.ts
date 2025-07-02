const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function signup({ email, full_name, username, password }: { email: string; full_name: string; username: string; password: string }) {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name, username, password })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Signup failed");
    }
    return data;
}

export async function login({ email, password }: { email: string; password: string }) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Login failed");
    }
    return data;
}

export async function googleAuth({ token }: { token: string }) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Google auth failed");
    }
    return data;
}

// GitHub OAuth: exchange code for token
export async function githubAuth({ code }: { code: string }) {
    const res = await fetch(`${BASE_URL}/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "GitHub auth failed");
    }
    return data;
}

export async function checkEmail(email: string): Promise<{ exists: boolean; isSocialUser: boolean }> {
    console.log('base url is:',BASE_URL)
    const res = await fetch(`${BASE_URL}/check-email?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Failed to check email");
    }
    return data;
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
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Failed to change password: status ${res.status}`);
    }
    return data;
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
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Failed to update info: status ${res.status}`);
    }
    return data;
}
