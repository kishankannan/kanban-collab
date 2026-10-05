export type GuestSession = {
  status: "guest";
  guestId: string;
  expiresAt: Date;
};

export type AuthenticatedSession = {
  status: "authenticated";
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export type UnauthenticatedSession = {
  status: "unauthenticated";
};

export type AppSession =
  | GuestSession
  | AuthenticatedSession
  | UnauthenticatedSession;

function getSessionHeaderMessage(session: AppSession): string {
  // Notice how TypeScript narrows the type automatically inside each branch:
  switch (session.status) {
    case "guest":
      // TypeScript allows session.guestId, but would error if you asked for session.user!
      return `Welcome Guest (${session.guestId}) - Demo expires at ${session.expiresAt.toLocaleTimeString()}`;
    case "authenticated":
      return `Signed in as ${session.user.name} (${session.user.email})`;
    case "unauthenticated":
      return "Please sign in or continue as guest to create boards";
  }
}

// 1. Create a dummy guest session object
const mockGuestSession: AppSession = {
  status: "guest",
  guestId: "gst_89213",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
};

// 2. Call the function and print the return value
console.log("\n--- DRILL 1 TEST OUTPUT ---");
console.log(getSessionHeaderMessage(mockGuestSession));

// 3. Test an authenticated user session
const mockAuthSession: AppSession = {
  status: "authenticated",
  user: {
    id: "usr_402",
    email: "alex@example.com",
    name: "Alex Dev",
  },
};
console.log(getSessionHeaderMessage(mockAuthSession));
console.log("----------------------------\n");