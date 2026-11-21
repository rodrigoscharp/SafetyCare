import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/app/:path*", "/oficina/:path*", "/seguradora/:path*", "/login", "/cadastro"],
};
