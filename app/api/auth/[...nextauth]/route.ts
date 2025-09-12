 
import NextAuth, { SessionStrategy } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Invalid email or password.')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid email or password.')
        }

        return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy, 
  },
  pages: {
    signIn: '/', 
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.email = user.email
    
       
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email

        session.user.name = token.name
      }
      return session
    },
  },
  secret: process.env.JWT_SECRET || 'your_secret_key',  
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
