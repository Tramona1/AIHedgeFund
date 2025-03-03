import { useState, useEffect } from 'react'

interface User {
  id: string
  email?: string
  name?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching the user - in a real app, this would call your auth provider
    const fetchUser = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // For demo purposes, we'll simulate a logged-in user
        // In a real app, you would check session/local storage or an auth provider
        const mockUser = {
          id: 'user123',
          email: 'user@example.com',
          name: 'Demo User'
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setUser(mockUser)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Failed to authenticate user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate sign in - in a real app, this would call your auth provider
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setUser({
        id: 'user123',
        email,
        name: 'Demo User'
      })
      
      return true
    } catch (err) {
      console.error('Error signing in:', err)
      setError('Failed to sign in')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)

    try {
      // Simulate sign out - in a real app, this would call your auth provider
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUser(null)
      
      return true
    } catch (err) {
      console.error('Error signing out:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut
  }
} 