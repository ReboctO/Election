import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        voterID: { label: "Voter ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.voterID || !credentials?.password) {
            throw new Error('Please enter voter ID and password');
          }

          const voter = await prisma.voter.findUnique({
            where: { voterID: parseInt(credentials.voterID) }
          });

          if (!voter) {
            throw new Error('Invalid voter ID or password');
          }

          if (voter.voterStat !== 'Active') {
            throw new Error('Your account is inactive. Please contact administrator.');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, voter.voterPass);

          if (!isPasswordValid) {
            throw new Error('Invalid voter ID or password');
          }

          return {
            id: voter.voterID.toString(),
            name: `${voter.voterFname} ${voter.voterLname}`,
            voterID: voter.voterID,
            voted: voter.voted,
            voterStat: voter.voterStat
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.voterID = user.voterID;
        token.voted = user.voted;
        token.voterStat = user.voterStat;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.voterID = token.voterID;
        session.user.voted = token.voted;
        session.user.voterStat = token.voterStat;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };