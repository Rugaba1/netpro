import NextAuth from 'next-auth';

export const authConfig = {
  providers: [], // Add providers with an empty array for now
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: { user?: any }, request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
  },
} as const;