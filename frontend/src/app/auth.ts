import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// zentto-auth es el microservicio centralizado de autenticación
// Todas las apps nuevas (tickets, sites, panel) autentican contra él
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL
  || process.env.NEXT_PUBLIC_AUTH_URL
  || "http://localhost:4600";

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
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // POST /auth/login en zentto-auth microservice
          const res = await fetch(`${AUTH_SERVICE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
              appId: "zentto-tickets",
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          if (!data.user) return null;

          // zentto-auth retorna { user, accessToken, refreshToken }
          const accessToken = data.accessToken || "";
          const userId = data.user.userId || data.user.username || "";
          const userName = data.user.displayName || data.user.username || "";

          // Enriquecer con datos del ERP (permisos, modulos, companies)
          const ERP_API = process.env.ERP_API_URL || process.env.NEXT_PUBLIC_ERP_API_URL || "http://localhost:4000";
          let profile: any = {};
          if (accessToken && ERP_API) {
            try {
              const profileRes = await fetch(`${ERP_API}/v1/auth/profile`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (profileRes.ok) profile = await profileRes.json();
            } catch { /* ERP no disponible — continuar sin enriquecimiento */ }
          }

          return {
            id: profile.userId || userId,
            name: profile.userName || userName,
            email: data.user.email,
            accessToken,
            refreshToken: data.refreshToken,
            isAdmin: profile.isAdmin ?? data.user.isAdmin ?? false,
            roles: data.user.roles ?? [],
            permisos: profile.permisos ?? null,
            modulos: profile.modulos ?? [],
            companyAccesses: profile.companyAccesses ?? data.user.companyAccesses ?? [],
            defaultCompany: profile.defaultCompany ?? null,
          };
        } catch (err) {
          console.error("[auth] Error autenticando contra zentto-auth:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.isAdmin = u.isAdmin;
        token.roles = u.roles;
        token.companyAccesses = u.companyAccesses;
      }

      // Verificar si el token sigue vigente
      if (token.accessToken) {
        try {
          const payload = JSON.parse(
            Buffer.from(String(token.accessToken).split(".")[1], "base64").toString()
          );
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expirado — intentar refresh
            const refreshed = await refreshAccessToken(
              String(token.refreshToken)
            );
            if (refreshed) {
              token.accessToken = refreshed.accessToken;
              token.refreshToken = refreshed.refreshToken ?? token.refreshToken;
            } else {
              // No se pudo refrescar — forzar logout
              token.error = "RefreshAccessTokenError";
            }
          }
        } catch {
          // Token malformado
        }
      }

      return token;
    },
    async session({ session, token }) {
      const s = session as Record<string, unknown>;
      s.accessToken = token.accessToken;
      s.isAdmin = token.isAdmin;
      s.roles = token.roles;
      s.companyAccesses = token.companyAccesses;
      s.error = token.error;
      return session;
    },
  },
});

/**
 * Refresh token contra zentto-auth
 */
async function refreshAccessToken(refreshToken: string) {
  const AUTH_SERVICE = process.env.AUTH_SERVICE_URL
    || process.env.NEXT_PUBLIC_AUTH_URL
    || "http://localhost:4600";

  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `zentto_refresh=${refreshToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch {
    return null;
  }
}
