import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { ROLE_HOME, isRole, requiredRoleForPath } from "@/domain/roles";

/** Configuração compatível com Edge (usada pelo middleware). Sem Prisma/bcrypt aqui. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && isRole(token.role)) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const required = requiredRoleForPath(pathname);

      if ((pathname === "/login" || pathname === "/cadastro") && role) {
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.nextUrl));
      }
      if (!required) return true;
      if (!role) return false; // redireciona para /login
      if (role !== required) {
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
