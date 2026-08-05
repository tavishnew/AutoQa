import { createAuthClient } from "better-auth/react";

const authBaseURL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_BETTER_AUTH_URL
    ? import.meta.env.VITE_BETTER_AUTH_URL
    : "/api/auth";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export type AuthClientSession = typeof authClient.$Infer.Session.session & {
  user: typeof authClient.$Infer.Session.user;
};
export type AuthClientUser = typeof authClient.$Infer.Session.user;
