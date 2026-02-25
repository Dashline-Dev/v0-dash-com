# Community Circle -- Features & UX Reference

## Overview

Community Circle is a location-aware community platform built with Next.js 16 (App Router), Neon PostgreSQL, and custom bcrypt-based authentication. It enables users to discover, join, and manage interest-based communities organized around geographic areas, with integrated event management, sub-spaces, announcements, and an RBAC permission system.

**Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Neon Serverless PostgreSQL, Google Maps API, bcrypt authentication, Vercel Analytics.

---

## 1. Authentication & User Accounts

### Sign Up / Sign In
- **Route:** `/signup`, `/signin`
- Custom email + password authentication (not Neon Auth / Stack Auth)
- Passwords hashed with bcrypt (12 rounds)
- Session-based auth via HTTP-only cookies (`session_token`)
- Sessions stored in `auth_sessions` table with expiry
- Sign-in form also appears as a non-dismissible modal overlay (`AuthRequiredModal`) on any protected page so users stay on the current URL instead of being redirected

### Account Settings
- **Route:** `/settings`
- Change display name
- Change email (requires current password)
- Change password (requires current password)
- Delete account (requires current password, cascades membership cleanup)

### User Profile
- **Route:** `/profile`
- Editable: display name, bio, location, website URL
- Shows community count, event count stats
- Lists community memberships

---

## 2. Navigation & Shell

### Top Navigation (Desktop)
- Logo + app name ("Community Circle")
- Navigation links: Home, Explore, Communities, Events, Areas
- Global search button (opens Command Palette with `Cmd+K`)
- "+ Create" dropdown (Community, Event, Space, Announcement)
- User avatar menu (Profile, Settings, Sign Out) or Sign In/Up buttons

### Bottom Navigation (Mobile)
- Fixed bottom bar with icons: Home, Explore, Communities, Events, Profile
- Active state indicator
- Hidden on desktop (`md:hidden`)

### Command Palette
- `Cmd+K` / `Ctrl+K` keyboard shortcut
- Global search across communities, events, spaces, areas
- Type-ahead with result grouping by entity type
- Direct navigation to result detail page

---

## 3. Home Page (`/`)

- **Explore by Area:** Horizontal scrollable pills showing cities with community counts
- **Trending:** Compact row list showing top communities/events by member count or RSVPs
- **Upcoming Events:** Compact list of next 8 upcoming events with date/time, type badges, RSVP counts
- **Featured Communities:** Row list of 8 communities with avatar, name, location, member count

---

## 4. Explore Page (`/explore`)

- Full-text search bar across all entity types
- Entity type filter pills: All, Communities, Events, Areas, Spaces
- Toggle between List view and Map view
- **List view:** Compact search results with type icon, title, subtitle, metadata
- **Map view:** Google Maps with markers for all geolocated results (communities + events), info windows on click
- Infinite "Load more" pagination

---

## 5. Communities

### Community List (`/communities`)
- Search bar with real-time filtering
- **Faceted filters** (dynamic, based on loaded data):
  - Category (General, Technology, Sports, Arts, Neighborhood, Wellness, Education, Music, Food, Gaming, Business, Social)
  - Join Policy (Open, Approval, Invite Only)
- Compact row list: avatar, name, location, tags, member count
- Cursor-based infinite scroll ("Load more")

### Community Detail (`/communities/[slug]`)
- **Header:** Cover image, avatar, name, description, location, member count, verified badge
- **Join/Leave button** respecting join policy (open = instant join, approval = request, invite = disabled)
- **Tabbed content:**
  - **About:** Full description, community rules, tags, contact info, timezone
  - **Events:** Unified EventsView (Calendar + List + Map tabs)
  - **Spaces:** Row list of community spaces
  - **Announcements:** Row list of community announcements
  - **Members:** Paginated member list with roles, avatar, join date

### Community Creation (`/communities/create`)
- 5-step wizard with progress indicator:
  1. **Basics:** Name (auto-generates slug), description, category, community type, visibility, join policy, posting policy
  2. **Appearance:** Cover image URL, avatar URL
  3. **Location:** Location name, map coordinates
  4. **Rules & Tags:** Add/remove rules (title + description), add/remove tags
  5. **Review:** Summary of all fields before submission
- Creates community and redirects to new community page

### Community Admin (`/communities/[slug]/admin`)
- Accessible to community owners/admins
- Tabbed interface:
  - **Settings:** Edit all community fields (name, description, category, policies, etc.)
  - **Members:** Search, filter by role/status, change roles, approve/reject pending, ban/unban, remove members
  - **Analytics:** Active/pending/banned member counts, new members this week/month, role breakdown chart
  - **Roles:** Visual permission matrix showing what each role can do
  - **Audit Log:** Timestamped log of admin actions (role changes, bans, settings changes) with actor, target, details

---

## 6. Events

### Events Page (`/events`)
- Unified **EventsView** component with three tabs:
  - **Calendar:** Sub-views for Today (vertical timeline), Week (7-column grid), Month (traditional calendar grid). Navigate between periods. Click a date/event to see details inline.
  - **List:** Search bar, upcoming/all toggle, faceted type filter (In Person, Virtual, Hybrid) with counts, compact row list, "Load more"
  - **Map:** Google Maps with event markers, compact event list below the map

### Event Detail (`/events/[slug]`)
- Event title, description, type badge (In Person / Virtual / Hybrid)
- Date/time range with timezone
- Location with address (in-person) or virtual link (virtual/hybrid)
- Capacity indicator ("X spots left", "Sold out")
- **RSVP button:** Dropdown with Going / Interested / Not Going options; Cancel RSVP. Disabled for past events or full events.
- Link back to community
- Breadcrumb navigation

### Event Creation (`/events/create`, `/communities/[slug]/events/create`)
- Form fields: Title, description, event type, start/end datetime, timezone, location (name + address + coordinates), virtual link, max attendees, cover image
- Community-scoped creation pre-selects the community

### Event Calendar Page (`/events/calendar`)
- Same unified EventsView starting on Calendar tab

---

## 7. Spaces

### Spaces List (`/spaces`)
- Search bar
- **Faceted filters:** Type (Discussion, Event, Project, Resource), Visibility (Public, Members Only, Private)
- Compact row list: icon, name, community name, type badge, member count

### Space Detail (`/spaces/[slug]`, `/communities/[slug]/spaces/[spaceSlug]`)
- Space header with icon, name, description, type, visibility, member count
- Community link
- Member list

### Space Creation (`/spaces/create`, `/communities/[slug]/spaces/create`)
- Form: Name (auto-slug), description, type, icon (20 icon options), visibility, cover image
- Community-scoped creation pre-selects the community

**Space Types:**
| Type | Icon | Description |
|------|------|-------------|
| Discussion | MessageCircle | General conversation |
| Event | Calendar | Event-related space |
| Project | Rocket | Project collaboration |
| Resource | BookOpen | Shared resources |

---

## 8. Announcements

### Announcements List (`/announcements`)
- Search bar
- **Faceted filters:** Priority (Normal, High, Critical), Community
- Compact row list: priority indicator, title, community name, time ago, pinned badge

### Announcement Detail (`/announcements/[id]`)
- Title, body, priority badge, pin status
- Community link, author info, timestamps
- View count, analytics

### Announcement Creation (`/announcements/create`, `/communities/[slug]/announcements/create`)
- Template picker (optional, from community templates)
- Form: Title, body (textarea), priority, status (Draft / Published / Scheduled), publish time, recurrence rule (None / Daily / Weekly / Biweekly / Monthly)

**Priority Levels:**
| Priority | Visual |
|----------|--------|
| Normal | Default secondary style |
| High | Amber/yellow badge |
| Critical | Red badge |

---

## 9. Areas

### Areas List (`/areas`)
- Search with area type filter
- Compact row list: name, type badge (City / Neighborhood), community count, event count

### Area Detail (`/areas/[slug]`)
- Header with name, description, type, parent area link
- Google Map showing area bounds with community + event markers
- Neighborhood list (if city area)
- Community list within area
- Event list within area
- Map legend

---

## 10. Platform Admin (`/admin`)

- Restricted to superadmin users (`is_superadmin` flag)
- **Overview tab:** Platform-wide stats (total users, communities, events, spaces, announcements)
- **Users tab:** Paginated user list with search, toggle superadmin status
- **Communities tab:** Paginated community list with search, view details
- **Audit Log tab:** Platform-wide audit trail

---

## 11. Permissions & Roles

### Role Hierarchy (highest to lowest)
1. **Super Admin** -- Platform-wide access, can toggle other superadmins
2. **Owner** -- Full community control, can delete community
3. **Admin** -- Manage settings, ban members, change roles, view analytics
4. **Moderator** -- Approve members, moderate content, edit any post/event
5. **Member** -- Create content, create events, edit/delete own content
6. **Guest** -- View public content only

### Permission Matrix
| Permission | Min Role |
|-----------|----------|
| Community edit | Admin |
| Community delete | Owner |
| Member invite/approve | Moderator |
| Member ban/role change | Admin |
| Content create | Member |
| Content moderate (edit/delete any) | Moderator |
| Event create | Member |
| Event edit/delete any | Moderator/Admin |
| Space create/edit | Admin |
| Space delete | Owner |
| Analytics view | Admin |
| Audit log view | Admin |

---

## 12. Data Model Summary

### Core Entities
| Table | Key Fields |
|-------|------------|
| `auth_users` | id, email, password_hash, display_name, avatar_url, is_superadmin |
| `auth_sessions` | token, user_id, expires_at |
| `user_profiles` | neon_auth_id, display_name, bio, location_name, website_url, avatar_url |
| `communities` | name, slug, category, type, visibility, join_policy, posting_policy, location, member_count, search_vector |
| `community_members` | community_id, user_id, role, status, notification_preference |
| `community_tags` | community_id, tag |
| `community_rules` | community_id, title, description, sort_order |
| `community_areas` | community_id, area_id |
| `events` | title, slug, community_id, space_id, event_type, status, start/end_time, location, max_attendees, rsvp_count, search_vector |
| `event_rsvps` | event_id, user_id, status (going/interested/not_going) |
| `spaces` | name, slug, community_id, type, icon, visibility, status, search_vector |
| `space_members` | space_id, user_id, role |
| `announcements` | title, body, community_id, space_id, priority, status, is_pinned, recurrence_rule, view_count |
| `announcement_templates` | community_id, name, title_template, body_template, priority |
| `areas` | name, slug, type (city/neighborhood), parent_id, lat/lng, bounds, place_id, search_vector |
| `area_zip_codes` | area_id, zip_code |
| `permission_audit_log` | actor_id, target_user_id, community_id, action, details |

### Full-Text Search
- Communities, events, spaces, and areas all have `search_vector` columns (tsvector) for PostgreSQL full-text search
- Used by the global search (Command Palette) and the Explore page

---

## 13. UX Patterns

### Design System
- **Color scheme:** Warm earth-tone palette (brown/taupe primary, cream backgrounds)
- **Typography:** Geist Sans + Geist Mono via `next/font/google`
- **Layout:** Reddit-inspired compact rows with `border-b` separators, no large card grids
- **Spacing:** Tight, max-width `4xl` containers, `text-xl` headings

### Component Patterns
- **Compact row items:** All list items (communities, events, spaces, announcements, areas) use a single-row horizontal layout with inline avatar/icon, title, metadata, and right-aligned stats
- **Bordered list containers:** `border border-border rounded-lg divide-y divide-border overflow-hidden`
- **Faceted filters:** Dropdown buttons that show options dynamically derived from loaded data with result counts
- **Inline search:** `CommunitySearch` component with debounced input, search icon, clear button
- **Auth modal:** Non-dismissible dialog overlay that keeps the user on the current URL when authentication is required
- **Step wizard:** Multi-step forms with progress indicator for community creation
- **RSVP dropdown:** Three-option dropdown (Going / Interested / Not Going) with visual state indicators

### Navigation Patterns
- Desktop: Horizontal top nav with links + user menu
- Mobile: Fixed bottom tab bar with 5 primary destinations
- Breadcrumbs on detail pages
- "Back" links where contextually appropriate
- `+ Create` dropdown accessible from top nav on any page

### Data Loading
- Server-side initial data via Server Components
- Client-side pagination with "Load more" buttons
- SWR-like pattern: server actions called in `useTransition` for seamless loading states
- Cursor-based pagination for communities, offset-based for events/spaces/announcements
