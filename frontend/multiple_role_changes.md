# API Route Changes: Organization Member Roles

## 1. Multiple Roles per Member
- Organization members can now have **multiple roles** (e.g., `["admin", "member"]`).
- The database, schemas, and all relevant endpoints now use a list of roles instead of a single role string.

## 2. API Response Changes
- All endpoints that return organization member info now use `roles: List[str]` instead of `role: str`.
- The `/organizations/{org_id}` endpoint now returns `current_user_roles: List[str]` (was `current_user_role: str`).

## 3. Update Member Roles
- The endpoint to update a member’s roles now expects a list of roles:
  ```json
  { "roles": ["admin", "editor"] }
  ```

## 4. Listing Members
- The `/organizations/{org_id}/members` endpoint returns each member’s full list of roles.

## 5. Admin Checks
- All admin checks now look for `"admin"` in the `roles` list, not for a single `role` string.

## 6. Example Response
```json
{
  "id": 1,
  "name": "Acme Org",
  "created_by_user_id": 2,
  "created_at": "2025-06-26T12:00:00Z",
  "members": [
    {
      "id": 10,
      "user_id": 2,
      "organization_id": 1,
      "roles": ["admin", "member"],
      "user": { /* ...user fields... */ }
    }
  ],
  "current_user_roles": ["admin", "member"]
}
```

## 7. Action Required for Frontend
- Update all code that reads or writes member roles to use arrays/lists instead of single strings.
- Update any UI that displays or edits roles accordingly.
