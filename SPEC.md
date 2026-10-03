# Product Specification: Collaborative Kanban Board

## 1. Problem Statement
Teams and solo builders need a fast, visual, real-time task board with zero onboarding friction for quick reviews and comprehensive identity handling for production users.

## 2. Target Audience & Roles
- **Owner / Member:** Authenticated user (OAuth or Magic Link) who creates workspaces, manages boards, reorders cards, and invites collaborators.
- **Guest / Demo User:** Unauthenticated visitor granted an ephemeral session (24h TTL) to explore boards and test core interactions without signing up.
- **Viewer:** Read-only access to public or shared boards.

## 3. Core User Stories & Acceptance Criteria

### US-1: Multi-Tier Authentication & Session Management
- As a user, I want multiple login options (Google, GitHub, Magic Link, or Instant Guest Access) so I can choose the method that fits my context.
- **Acceptance Criteria:**
  - **Google & GitHub OAuth:** One-click sign-in via Auth.js; auto-provisions `User` and `Account` rows.
  - **Magic Link:** Email submission triggers a single-use verification token (15-minute TTL) sent via email (Resend); burns token on successful verification.
  - **Guest Access:** "Continue as Guest" creates an ephemeral session (`isGuest: true`, 24-hour cookie expiration) and seeds a personal demo board.
  - **Account Upgrades:** Guests can link a Google/GitHub account or email to convert their guest workspace into a permanent account.
  - **Session Security:** Session tokens are delivered exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies; unauthenticated requests to `/dashboard/*` redirect to `/login`.

### US-2: Workspace & Board Management
- As a user, I want to create, rename, and delete boards.
- **Acceptance Criteria:**
  - Board creation with custom titles and accent colors.
  - Newly created boards auto-generate three default columns: "To Do", "In Progress", and "Done".
  - Board deletion prompts for confirmation and cascades deletion to columns, cards, and activity logs.

### US-3: Column & Card CRUD
- As a user, I want to manage task cards within columns.
- **Acceptance Criteria:**
  - Inline card creation at the bottom of any column.
  - Card modal with editable title, markdown description, priority tags, and due date.
  - Soft-delete or immediate removal of cards.

### US-4: Drag-and-Drop Reordering (Optimistic UI)
- As a user, I want to drag cards within and between columns with zero UI lag.
- **Acceptance Criteria:**
  - Card movement responds immediately using React optimistic state.
  - Card positions are persisted using fractional/lexicographical order keys (single-row update).
  - Failed network mutations trigger automatic UI rollback and toast notification.

### US-5: Real-Time Synchronization & Activity Feed
- As a collaborator, I want board updates to reflect across open sessions in real time.
- **Acceptance Criteria:**
  - Database change subscriptions push card movements and additions to all active viewers.
  - Board activity drawer logs actions (e.g., "Guest moved 'Setup CI/CD' to Done").

## 4. Technical Non-Functional Requirements
- **Performance:** Initial page load under 1.2s; drag-and-drop client render latency under 16ms (60 FPS).
- **Security:** Strict Server Action authorization checks (users can only mutate resources where `workspace.owner_id == session.user.id` or user is a member).
- **Deployment:** CI/CD via GitHub Actions and Vercel Preview Deployments.

## 5. Explicitly Out of Scope (Phase 1)
- File attachments / cloud media storage.
- Paid billing / team seat management.
- Granular column-level permission ACLs.