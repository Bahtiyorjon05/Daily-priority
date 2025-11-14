import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfile {
  name: string
  email: string
  image: string | null
  location: string
  timezone: string
}

let profileCache: UserProfile | null = null
let profilePromise: Promise<UserProfile> | null = null

export function useUserProfile() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(profileCache)
  const [loading, setLoading] = useState(!profileCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // If we already have cached data, use it immediately
    if (profileCache) {
      setProfile(profileCache)
      setLoading(false)
      return
    }

    // If there's already a fetch in progress, wait for it
    if (profilePromise) {
      profilePromise
        .then(data => {
          setProfile(data)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
      return
    }

    // Start a new fetch
    setLoading(true)
    profilePromise = fetch('/api/user/profile')
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json()
        const userProfile: UserProfile = {
          name: data.profile.name || 'User',
          email: data.profile.email || '',
          image: data.profile.image || null,
          location: data.profile.location || '',
          timezone: data.profile.timezone || ''
        }
        profileCache = userProfile
        return userProfile
      })
      .catch((err) => {
        profilePromise = null
        throw err
      })

    profilePromise
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
        // Set default values on error
        setProfile({
          name: 'User',
          email: session.user.email || '',
          image: null,
          location: '',
          timezone: ''
        })
      })
  }, [session])

  const refreshProfile = async () => {
    if (!session?.user) return

    setLoading(true)
    profileCache = null
    profilePromise = null

    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      const userProfile: UserProfile = {
        name: data.profile.name || 'User',
        email: data.profile.email || '',
        image: data.profile.image || null,
        location: data.profile.location || '',
        timezone: data.profile.timezone || ''
      }
      profileCache = userProfile
      setProfile(userProfile)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return { profile, loading, error, refreshProfile }
}
