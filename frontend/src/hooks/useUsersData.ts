import { useState, useEffect } from 'react'
import axiosInstance from '../lib/axiosInstance'

export interface User {
  id: string
  name: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

interface UseUsersDataReturn {
  users: User[]
  isLoading: boolean
  error: string | null
}

export function useUsersData(): UseUsersDataReturn {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null)

        // Admin endpoint to fetch all users/customers
        const response = await axiosInstance.get('/admin/users')
        setUsers(response.data.data || response.data || [])
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch users'
        setError(errorMsg)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, isLoading, error }
}
