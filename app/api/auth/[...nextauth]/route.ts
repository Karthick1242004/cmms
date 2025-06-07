import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB()
          
          // Check if user exists
          let existingUser = await User.findOne({ 
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId }
            ]
          })

          if (existingUser) {
            // Update existing user with Google ID if not set
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId
              existingUser.avatar = user.image
              existingUser.lastLoginAt = new Date()
              await existingUser.save()
            }
          } else {
            // Create new OAuth user
            const roleMapping: Record<string, { role: string; department: string }> = {
              "admin@company.com": { role: "admin", department: "IT" },
              "manager@company.com": { role: "manager", department: "Maintenance" },
              "tech@company.com": { role: "technician", department: "HVAC" },
            }
            
            const userInfo = roleMapping[user.email!] || { role: "technician", department: "General" }
            
            const newUser = new User({
              email: user.email,
              name: user.name,
              avatar: user.image,
              authMethod: 'oauth',
              googleId: account.providerAccountId,
              emailVerified: true,
              role: userInfo.role,
              department: userInfo.department,
              firstName: user.name?.split(' ')[0],
              lastName: user.name?.split(' ').slice(1).join(' '),
              jobTitle: userInfo.role,
              employeeId: `OAUTH-${Date.now()}`,
              lastLoginAt: new Date()
            })

            // Check profile completion for new OAuth users
            newUser.checkProfileCompletion()
            await newUser.save()
          }
          
          return true
        } catch (error) {
          console.error('OAuth sign-in error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: session.user.email })
          
          if (dbUser) {
            session.user.id = dbUser._id.toString()
            session.user.role = dbUser.role
            session.user.department = dbUser.department
            session.user.profileCompleted = dbUser.profileCompleted
            session.user.profileCompletionFields = dbUser.profileCompletionFields
          }
        } catch (error) {
          console.error('Session callback error:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 