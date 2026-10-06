---
name: add-admin-page
description: Add a page to this app's role-gated admin console under /admin — the route, its nav entry, noindex meta, and the API-side check it relies on. Use when asked to "add an admin page", "build the X queue/table for admins", "a console screen for moderators", or for any back-office screen.
---

# Add an admin page

The console is the `/admin` branch in `src/app/router.tsx`, wrapped in
`RoleRoute allow={['admin', 'superuser']}` with its own shell and
`ADMIN_NAV_ITEMS` in `src/app/nav.tsx`. `src/routes/admin/home.tsx` is the
example page.

1. **Build the page** in `src/routes/admin/<name>.tsx` the way `add-screen`
   describes (data slice, states, kit components), with
   `<PageMeta title="Things" robots="noindex" />`.

2. **Register it** as a child of the `/admin` route in `router.tsx` (relative
   path, lazy import) and add an `ADMIN_NAV_ITEMS` entry with
   `` to: `${ADMIN_BASE}/things` ``.

3. **Roles.** `RoleRoute` hides the console from the wrong users; it does not
   protect anything. Every endpoint the page calls must check the role or
   permission on the API. If only some admin roles may open this page, wrap
   its route in its own `RoleRoute` with that narrower `allow` list, and make
   the API agree.

4. **Check**: sign in as each role the console admits (and one it does not)
   and confirm what renders, then confirm the API refuses the request for the
   role that should not have it.
