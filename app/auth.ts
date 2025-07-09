import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { compare } from 'bcrypt-ts';
import { getUserByUsernameOrEmail, createOAuthUser, getUserByGoogleId, linkGoogleAccount, getUserByGithubId, linkGithubAccount } from 'app/db';
import { authConfig } from 'app/auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      async authorize({ email, password }: any) {
        let user = await getUserByUsernameOrEmail(email);
        if (user.length === 0) return null;
        let passwordsMatch = await compare(password, user[0].password!);
        if (passwordsMatch) return user[0] as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const googleId = account.providerAccountId;
        const email = user.email;
        const name = user.name;
        const avatar = user.image;
        
        if (!email || !name) {
          return false; // Require email and name for Google OAuth
        }
        
        // Check if user already exists with this Google ID
        const existingGoogleUser = await getUserByGoogleId(googleId);
        if (existingGoogleUser.length > 0) {
          // User exists, update their info
          user.id = existingGoogleUser[0].id.toString();
          return true;
        }
        
        // Check if user exists with this email (from regular registration)
        const existingEmailUser = await getUserByUsernameOrEmail(email);
        if (existingEmailUser.length > 0) {
          // Link Google account to existing user
          await linkGoogleAccount(existingEmailUser[0].id, googleId, name, avatar || undefined);
          user.id = existingEmailUser[0].id.toString();
          return true;
        }
        
        // Create new user
        const newUser = await createOAuthUser(email, name, avatar || undefined, googleId);
        user.id = newUser.id.toString();
        return true;
      }
      
      if (account?.provider === 'github') {
        const githubId = account.providerAccountId;
        const email = user.email;
        const name = user.name;
        const avatar = user.image;
        
        if (!email || !name) {
          return false; // Require email and name for GitHub OAuth
        }
        
        // Check if user already exists with this GitHub ID
        const existingGithubUser = await getUserByGithubId(githubId);
        if (existingGithubUser.length > 0) {
          // User exists, update their info
          user.id = existingGithubUser[0].id.toString();
          return true;
        }
        
        // Check if user exists with this email (from regular registration)
        const existingEmailUser = await getUserByUsernameOrEmail(email);
        if (existingEmailUser.length > 0) {
          // Link GitHub account to existing user
          await linkGithubAccount(existingEmailUser[0].id, githubId, name, avatar || undefined);
          user.id = existingEmailUser[0].id.toString();
          return true;
        }
        
        // Create new user
        const newUser = await createOAuthUser(email, name, avatar || undefined, undefined, githubId);
        user.id = newUser.id.toString();
        return true;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
