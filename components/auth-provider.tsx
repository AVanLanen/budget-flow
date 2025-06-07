"use client"

import type { AuthContextType, AuthProviderProps } from "@refinedev/core"
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react"
import { useRouter } from "next/router"

export const AuthProviderNextAuth = ({ children }: AuthProviderProps): JSX.Element => {
  return <SessionProvider>{children}</SessionProvider>
}

export const useAuth = (): AuthContextType => {
  const { data: session } = useSession()
  const router = useRouter()

  const authProvider: AuthContextType = {
    isInitialized: true,
    user: session?.user,
    signin: (variables: any) => {
      signIn("google", {
        ...variables,
        redirect: variables?.redirect || router.pathname,
      })
    },
    signout: () => {
      signOut({ redirect: router.pathname })
    },
    check: async () => {
      if (session) {
        return {
          authenticated: true,
        }
      }

      return {
        authenticated: false,
        error: {
          message: "Not authenticated",
          name: "AuthenticationError",
        },
        redirect: "/login",
      }
    },
    getPermissions: async () => {
      return session?.user?.permissions
    },
    getUserIdentity: async () => {
      return session?.user?.id
    },
    login: async () => {
      return {
        success: true,
      }
    },
    register: async () => {
      return {
        success: true,
      }
    },
    onError: async (error) => {
      console.error(error)
      return { error }
    },
  }

  return authProvider
}
