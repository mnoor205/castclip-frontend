import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { GoogleOAuthClient, GoogleOAuthInitConfig } from '@/lib/types'

interface GoogleOAuthHookReturn {
  isScriptReady: boolean
  isConnecting: boolean
  connectGoogle: () => Promise<void>
}

interface GoogleOAuthConfig {
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface GoogleResponse {
  code?: string
  error?: string
}

// Extend Window interface for Google API
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: GoogleOAuthInitConfig) => GoogleOAuthClient
        }
      }
    }
  }
}

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
const SCRIPT_LOAD_TIMEOUT = 10000
const INIT_CHECK_INTERVAL = 100
const INIT_CHECK_TIMEOUT = 5000
const INIT_DELAY = 100

export function useGoogleOAuth(config: GoogleOAuthConfig = {}): GoogleOAuthHookReturn {
  const [isScriptReady, setIsScriptReady] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const codeClientRef = useRef<GoogleOAuthClient | null>(null)

  const checkGoogleReady = useCallback(() => {
    return window.google?.accounts?.oauth2
  }, [])

  const loadGoogleScript = useCallback(() => {
    const existing = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null
    
    if (existing) {
      if (checkGoogleReady()) {
        setIsScriptReady(true)
        return
      }
      
      // Wait for existing script to be ready
      const interval = setInterval(() => {
        if (checkGoogleReady()) {
          setIsScriptReady(true)
          clearInterval(interval)
        }
      }, INIT_CHECK_INTERVAL)
      setTimeout(() => clearInterval(interval), SCRIPT_LOAD_TIMEOUT)
      return
    }
    
    // Create new script
    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.id = GOOGLE_IDENTITY_SCRIPT_ID
    
    script.onload = () => {
      // Allow time for initialization
      setTimeout(() => {
        if (checkGoogleReady()) {
          setIsScriptReady(true)
        } else {
          // Keep checking if not immediately ready
          const interval = setInterval(() => {
            if (checkGoogleReady()) {
              setIsScriptReady(true)
              clearInterval(interval)
            }
          }, INIT_CHECK_INTERVAL)
          setTimeout(() => clearInterval(interval), INIT_CHECK_TIMEOUT)
        }
      }, INIT_DELAY)
    }
    
    script.onerror = () => {
      console.error('Failed to load Google Identity Services')
      toast.error('Failed to load Google Identity Services')
    }
    
    document.body.appendChild(script)
  }, [checkGoogleReady])

  useEffect(() => {
    loadGoogleScript()
  }, [loadGoogleScript])

  const ensureCodeClient = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) throw new Error('server_misconfigured')

    const google = window.google
    if (!google) throw new Error('Google Identity Services not loaded')
    if (!google.accounts) throw new Error('Google accounts not available')
    if (!google.accounts.oauth2) throw new Error('Google OAuth2 not ready')

    if (!codeClientRef.current) {
      try {
        codeClientRef.current = google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: YOUTUBE_SCOPE,
          ux_mode: 'popup',
          redirect_uri: 'postmessage',
          callback: () => {}, // Will be set when needed
        })
      } catch (error) {
        console.error('Failed to initialize Google OAuth2 client:', error)
        throw new Error('Failed to initialize Google OAuth2 client')
      }
    }
  }, [])

  const exchangeCodeForToken = useCallback(async (code: string): Promise<void> => {
    const res = await fetch('/api/youtube/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || 'token_exchange_failed')
    }
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('Google connect failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown Google error'
    
    const errorMessages: Record<string, string> = {
      access_denied: 'Access denied by Google',
      server_misconfigured: 'Missing Google client ID env. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and restart server.',
      token_exchange_failed: 'Google token exchange failed. Check OAuth client & consent screen.',
      no_code_returned: 'No code returned by Google. Please try again.',
      'Google Identity Services not loaded': 'Google services failed to load. Please refresh the page and try again.',
      'Google accounts not available': 'Google authentication is not available. Please refresh the page.',
      'Google OAuth2 not ready': 'Google authentication is still loading. Please wait a moment and try again.',
      'Failed to initialize Google OAuth2 client': 'Failed to initialize Google authentication. Please refresh the page.',
    }

    const errorKey = Object.keys(errorMessages).find(key => message.includes(key))
    const errorMessage = errorKey ? errorMessages[errorKey] : `Failed to connect Google account: ${message}`
    
    toast.error(errorMessage)
    config.onError?.(message)
  }, [config])

  const connectGoogle = useCallback(async () => {
    if (!isScriptReady) {
      toast.info('Google services are still loading, please wait a moment and try again')
      return
    }
    
    setIsConnecting(true)
    try {
      ensureCodeClient()
      const code: string = await new Promise<string>((resolve, reject) => {
        try {
          const client = codeClientRef.current
          if (!client) {
            return reject(new Error('OAuth client not initialized'))
          }
          
          client.callback = (resp: GoogleResponse) => {
            if (resp?.code) return resolve(resp.code)
            if (resp?.error) return reject(new Error(resp.error))
            return reject(new Error('no_code_returned'))
          }
          client.requestCode()
        } catch (e) {
          reject(e)
        }
      })

      await exchangeCodeForToken(code)
      config.onSuccess?.()
    } catch (err: unknown) {
      handleError(err)
    } finally {
      setIsConnecting(false)
    }
  }, [isScriptReady, ensureCodeClient, exchangeCodeForToken, config, handleError])

  return {
    isScriptReady,
    isConnecting,
    connectGoogle,
  }
}
