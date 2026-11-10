
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

import { authAPI } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'finsight_access_token'
const USER_KEY = 'finsight_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Save authenticated session
  const saveSession = useCallback((token, userData) => {
    if (!token) {
      throw new Error('Authentication token was not returned by the server.')
    }

    localStorage.setItem(TOKEN_KEY, token)

    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
    }

    return userData
  }, [])

  // Check existing session when application starts
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const response = await authAPI.me()
        const userData = response.data.user || response.data

        if (isMounted) {
          setUser(userData)
          localStorage.setItem(USER_KEY, JSON.stringify(userData))
        }
      } catch (error) {
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Login
  const login = async (email, password) => {
    const response = await authAPI.login({
      email,
      password,
    })

    const data = response.data

    if (!data.access_token) {
      throw new Error('Login failed: no access token received.')
    }

    // Save token before requesting user information
    localStorage.setItem(TOKEN_KEY, data.access_token)

    let userData = data.user

    if (!userData) {
      try {
        const userResponse = await authAPI.me()
        userData = userResponse.data.user || userResponse.data
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY)
        throw error
      }
    }

    saveSession(data.access_token, userData)

    return data
  }

  // Register
  const register = async (userData) => {
    const response = await authAPI.register({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    })

    const data = response.data

    // Registration returned a complete authenticated session
    if (data.access_token) {
      let registeredUser = data.user

      if (!registeredUser) {
        localStorage.setItem(TOKEN_KEY, data.access_token)

        try {
          const userResponse = await authAPI.me()
          registeredUser = userResponse.data.user || userResponse.data
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY)
          throw error
        }
      }

      saveSession(data.access_token, registeredUser)

      return data
    }

    // Registration returned user data only.
    // Sign in automatically after successful registration.
    return login(userData.email, userData.password)
  }

  // Logout
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setUser(null)
  }

  // Update user information locally
  const updateUser = (updatedData) => {
    setUser((currentUser) => {
      if (!currentUser) return null

      const updatedUser = {
        ...currentUser,
        ...updatedData,
      }

      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))

      return updatedUser
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom authentication hook
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider',
    )
  }

  return context
}
