import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "kanban_session_token";
const GUEST_EXPIRY_DAYS = 7;

export interface CurrentUserSession {
  id: string;
  name: string | null;
  email: string | null;
  isGuest: boolean;
}

/**
 * Returns the current authenticated or guest user based on the cookie token.
 */
export async function getCurrentUser(): Promise<CurrentUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isGuest: true,
        },
      },
    },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return session.user;
}

/**
 * Provisions a guest User, a default sandbox Workspace, and an active Session.
 */
export async function createGuestSession(): Promise<{ token: string; userId: string }> {
  const cookieStore = await cookies();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * GUEST_EXPIRY_DAYS);

  // Run in a transaction to guarantee a ready-to-use sandbox
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the ephemeral guest user
    const guestUser = await tx.user.create({
      data: {
        name: `Guest-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        isGuest: true,
      },
    });

    // 2. Attach a default Sandbox Workspace for the guest
    const workspace = await tx.workspace.create({
      data: {
        name: "Sandbox Workspace",
        slug: `guest-sandbox-${crypto.randomBytes(4).toString("hex")}`,
        ownerId: guestUser.id,
      },
    });

    // 3. Create a starter Kanban Board with default columns
    const board = await tx.board.create({
      data: {
        title: "Sprint 1 (Demo)",
        workspaceId: workspace.id,
        columns: {
          create: [
            { title: "To Do", order: 1000 },
            { title: "In Progress", order: 2000 },
            { title: "Done", order: 3000 },
          ],
        },
      },
    });

    // 4. Create the session token entry
    await tx.session.create({
      data: {
        sessionToken,
        userId: guestUser.id,
        expires,
      },
    });

    return { token: sessionToken, userId: guestUser.id, boardId: board.id };
  });

  // Set HTTP-only session cookie
  cookieStore.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return { token: result.token, userId: result.userId };
}