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

export async function verifyEmail({ email, code }: { email: string; code: string }) {
    const res = await fetch(`${BASE_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
    }
    return data;
}

export async function resendVerificationCode({ email }: { email: string }) {
    const res = await fetch(`${BASE_URL}/resend-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Resend failed");
    }
    return data;
}

export async function sendPasswordResetEmail(email: string) {
    const res = await fetch(`${BASE_URL}/send-password-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Failed to send reset email");
    }
    return data;
}

export async function resetPassword(code: string, new_password: string) {
    const res = await fetch(`${BASE_URL}/reset-password?code=${encodeURIComponent(code)}&new_password=${encodeURIComponent(new_password)}`, {
        method: "POST"
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
    }
    return data;
}

export async function listLinkedAccounts() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/linked-accounts`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch linked accounts");
    }
    return data;
}

export async function linkAccount({ provider, token: oauthToken }: { provider: string; token: string }) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/link-account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ provider, token: oauthToken })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Failed to link ${provider} account`);
    }
    return data;
}

export async function unlinkAccount({ provider, email }: { provider: string; email: string }) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/unlink-account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ provider, email })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Failed to unlink ${provider} account`);
    }
    return data;
}
