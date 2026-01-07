import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // Get admin credentials from environment
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@wiredliving.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Validate credentials
        if (email === adminEmail && password === adminPassword) {
          return {
            id: '1',
            email: adminEmail,
            name: 'Admin',
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
});

