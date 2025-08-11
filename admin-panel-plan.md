## Global Admin Interface Implementation Plan (Excluding Email Templates)

This plan outlines concise frontend and backend changes to implement a global admin interface for managing users and organizations. It assumes a separate FastAPI router for admin APIs and dedicated React admin pages, accessible via a link for authenticated admin users from the existing dashboard.

---

### **Backend Changes (FastAPI)**

**1. Schema & Admin Authentication:**
   * **Modify `User` model:** Add `is_admin: Mapped[bool] = mapped_column(default=False)` to the `User` class.
   * Create `app/routers/admin.py` and include it in `app/main.py`.
   * Create `app/dependencies/admin_auth.py` to check `user.is_admin` for all admin routes.
   * (Optional) Add `is_admin` claim to JWT for admin users.

**2. User Management Endpoints:**
   * `GET /admin/users`: Paginated list of users (`id`, `email`, `created_at`, `username`, `phone_number`, `language`, `linked_accounts` [provider], `is_admin`). Support filtering/sorting.
   * `GET /admin/users/{user_id}`: Detailed user info.
   * `PUT /admin/users/{user_id}`: Update user info (`phone_number`, `language`), **set/unset `is_admin`**, **reset password** (send new password/reset link).
   * `DELETE /admin/users/{user_id}`: Delete user (with confirmation).

**3. Organization Management Endpoints (CRUD):**
   * `GET /admin/organizations`: Paginated list of organizations (`id`, `name`, `created_by_user_id`, `created_at`, `member_count`). Support filtering/sorting.
   * `GET /admin/organizations/{org_id}`: Detailed organization info, including members.
   * `POST /admin/organizations`: Create new organization (admin can specify `created_by_user_id`).
   * `PUT /admin/organizations/{org_id}`: Update organization (`name`), **change owner** (update `created_by_user_id`).
   * `DELETE /admin/organizations/{org_id}`: Delete organization (with confirmation, handle member dissociation).
   * `POST /admin/organizations/{org_id}/members`: Add user to organization (specify `user_id`, `roles`).
   * `DELETE /admin/organizations/{org_id}/members/{user_id}`: Remove user from organization.

**4. Database & Error Handling:**
   * Implement SQLAlchemy operations for new fields and all CRUD.
   * Implement robust error handling (e.g., 404 Not Found, 401 Unauthorized, 403 Forbidden, 400 Bad Request).

---

### **Frontend Changes (React/Vite)**

**1. Admin Routing & Layout:**
   * Create `AdminLayout.jsx` for consistent admin navigation and structure.
   * Implement protected Wouter routes for admin-only access.
   * **In the existing user dashboard, if the logged-in user's data indicates `is_admin: true`, display a prominent link (e.g., "Switch to Admin View") that navigates to the admin dashboard.**

**2. Admin Dashboard:**
   * Central landing page for the admin view with high-level overview (user/organization counts).

**3. User Management Page:**
   * **User Table:** Paginated, sortable table (`Email`, `Last Login`, `Username`, `Phone`, `Language`, `Admin Status`). Include search/filter.
   * **User Detail/Edit:** Page/modal to view/edit user details. Include `Admin Status` toggle, **"Reset Password"**, and **"Delete User"** buttons (with confirmation). Display linked social accounts (`provider`).

**4. Organization Management Page:**
   * **Organization Table:** Paginated, sortable table (`Name`, `Owner (email/username)`, `Created At`, `Members Count`). Include search/filter.
   * **Organization Detail/Edit:** Page/modal to view/edit organization details. Fields: `Name`, `Owner` (searchable user list, uses `user.id`). Display members with remove option. Include **"Add Member"** (input for user ID/email, roles) and **"Delete Organization"** buttons (with confirmation).