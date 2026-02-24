import type { Express, Request, RequestHandler } from "express";
import session from "express-session";
import memorystore from "memorystore";
import { storage } from "./storage";

const MemoryStore = memorystore(session);

export interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

declare module "express-session" {
  interface SessionData {
    user?: AuthUser;
  }
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}

const createDefaultUser = (): AuthUser => ({
  id: process.env.DEFAULT_USER_ID ?? "demo-user",
  email: process.env.DEFAULT_USER_EMAIL ?? "demo@studybot.local",
  firstName: process.env.DEFAULT_USER_FIRST_NAME ?? "Demo",
  lastName: process.env.DEFAULT_USER_LAST_NAME ?? "User",
});

export async function setupAuth(app: Express) {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  const secureCookies = process.env.NODE_ENV === "production";

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "studybot-dev-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: sessionTtlMs,
      }),
      cookie: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: secureCookies ? "none" : "lax",
        maxAge: sessionTtlMs,
      },
    }),
  );

  const defaultUser = createDefaultUser();
  await storage.upsertUser({
    id: defaultUser.id,
    email: defaultUser.email ?? undefined,
    firstName: defaultUser.firstName ?? undefined,
    lastName: defaultUser.lastName ?? undefined,
  });

  app.use((req, _res, next) => {
    if (!req.session.user) {
      req.session.user = defaultUser;
    }

    req.user = req.session.user;
    next();
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.user?.id) {
    req.user = req.session.user;
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};

export function getRequestUserId(req: Request): string {
  const user = req.user as AuthUser | undefined;
  if (!user?.id) {
    throw new Error("Authenticated user is required");
  }
  return user.id;
}

