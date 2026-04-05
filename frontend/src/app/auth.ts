import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4700";
const ZENTTO_API = process.env.ZENTTO_API_URL || process.env.NEXT_PUBLIC_ZENTTO_API_URL || "http://localhost:4000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Zentto",
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        clave: { label: "Contraseña", type: "password" },
        companyId: { label: "CompanyId", type: "text" },
        branchId: { label: "BranchId", type: "text" },
      },
      async authorize(credentials) {
        try {
          // Autenticar contra zentto-web API (microservicio de auth)
          const res = await fetch(`${ZENTTO_API}/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario: credentials?.usuario,
              clave: credentials?.clave,
              companyId: credentials?.companyId ? Number(credentials.companyId) : undefined,
              branchId: credentials?.branchId ? Number(credentials.branchId) : undefined,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          if (!data.token) return null;

          return {
            id: data.userId,
            name: data.userName,
            email: data.email,
            accessToken: data.token,
            isAdmin: data.isAdmin,
            modulos: data.modulos,
            permisos: data.permisos,
            companyAccesses: data.companyAccesses,
            defaultCompany: data.defaultCompany,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as Record<string, unknown>).accessToken;
        token.isAdmin = (user as Record<string, unknown>).isAdmin;
        token.modulos = (user as Record<string, unknown>).modulos;
        token.permisos = (user as Record<string, unknown>).permisos;
        token.companyAccesses = (user as Record<string, unknown>).companyAccesses;
        token.defaultCompany = (user as Record<string, unknown>).defaultCompany;
      }
      return token;
    },
    async session({ session, token }) {
      (session as Record<string, unknown>).accessToken = token.accessToken;
      (session as Record<string, unknown>).isAdmin = token.isAdmin;
      (session as Record<string, unknown>).modulos = token.modulos;
      (session as Record<string, unknown>).permisos = token.permisos;
      (session as Record<string, unknown>).companyAccesses = token.companyAccesses;
      (session as Record<string, unknown>).defaultCompany = token.defaultCompany;
      return session;
    },
  },
});
