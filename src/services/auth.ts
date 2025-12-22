import { User, LoginRequest, RegisterRequest } from '../types/index'

const API_BASE_URL = 'https://general-backend-production-a734.up.railway.app'
const TOKEN_KEY = 'auth_token'

interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

interface ErrorResponse {
  detail: string | { msg: string; type: string }[]
}

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(TOKEN_KEY)
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private handleError(error: any): never {
    if (error.detail) {
      if (typeof error.detail === 'string') {
        throw new Error(error.detail)
      } else if (Array.isArray(error.detail)) {
        const messages = error.detail.map((err: any) => err.msg).join(', ')
        throw new Error(messages)
      }
    }
    throw new Error('Ein unerwarteter Fehler ist aufgetreten')
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password } as LoginRequest),
      })

      if (!response.ok) {
        const error: ErrorResponse = await response.json()
        this.handleError(error)
      }

      const data: AuthResponse = await response.json()
      localStorage.setItem(TOKEN_KEY, data.access_token)
      return data.user
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Verbindung.')
    }
  }

  async register(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password } as RegisterRequest),
      })

      if (!response.ok) {
        const error: ErrorResponse = await response.json()
        this.handleError(error)
      }

      const data: AuthResponse = await response.json()
      localStorage.setItem(TOKEN_KEY, data.access_token)
      return data.user
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
  }

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        return
      }

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })
    } catch (error) {
      // Logout errors are not critical, we still clear the token
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        throw new Error('Nicht authentifiziert')
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          throw new Error('Sitzung abgelaufen. Bitte melden Sie sich erneut an.')
        }
        const error: ErrorResponse = await response.json()
        this.handleError(error)
      }

      const user: User = await response.json()
      return user
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Benutzer konnte nicht geladen werden.')
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY)
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }
}

export const authService = new AuthService()
