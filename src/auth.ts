import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { verifyCredentials } from "@/server/services/auth";
import { clientIpFromHeaders } from "@/server/request";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const ip = request ? clientIpFromHeaders(request.headers) : "unknown";
        const user = await verifyCredentials(credentials, ip);
        return user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
      },
    }),
  ],
});
