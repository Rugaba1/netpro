import NextAuth, { SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// Authenticate user with your external API
async function authenticateUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return null
    }

    // Your API should return:
    // {
    //   user: { id, name, email, role },
    //   accessToken: "jwt-token",
    //   refreshToken: "refresh-token",
    //   expiresIn: 3600
    // }
    return data
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const authResult = await authenticateUser(
          credentials.email, 
          credentials.password
        )

        if (!authResult) return null

        return {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          accessTokenExpires: Date.now() + (authResult.expiresIn * 1000),
        }
      }
    })
  ],

  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}

// App Router requires explicit exports
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }