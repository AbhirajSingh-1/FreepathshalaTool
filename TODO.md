# TODO: Backend-Driven Role Management Refactoring

## Task
Refactor FreePathshala to move all role management and authorization logic from frontend to backend.

## Steps

- [x] 1. Update RoleContext.jsx - Remove hardcoded role logic, simplify to only store role from backend
- [x] 2. Update Sidebar.jsx - Use role from props/context instead of localStorage
- [x] 3. Update App.jsx - Remove navigation validation using ROLE_PAGES, rely on backend for authorization

## Status
- [x] Completed

## Notes
- Backend already has proper role-based middleware
- Frontend should only handle UI rendering based on role from backend
- All authorization is enforced server-side

## Summary of Changes

### RoleContext.jsx
- Removed: ROLES, ROLE_PAGES, DEFAULT_PAGE constants (kept only ROLES for UI display)
- Removed: `can` permissions object (backend enforces this with middleware)
- Removed: `changeRole` function (role managed entirely by backend)
- Simplified: Now only stores user, role, authLoading state from backend response

### Sidebar.jsx
- Changed: Uses role from props or RoleContext instead of localStorage
- Removed: `getRole()` function that read from localStorage

### App.jsx
- Changed: Removed `isAccessible` check before rendering pages
- Changed: Frontend allows navigation to any page without validation
- Removed: REFERENCE to removed ROLE_PAGES constant
- Backend now enforces authorization and returns 403 for unauthorized access
