'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [voterID, setVoterID] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { voterID, password, redirect: false })
      result?.error ? setError(result.error) : (router.push('/vote'), router.refresh())
    } catch (error) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <h2 className="display-5 fw-bold">Voter Login</h2>
          <p className="text-muted">Sign in to your voting account</p>
        </div>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="card shadow-sm p-4">
          <div className="mb-3">
            <label htmlFor="voterID" className="form-label">Voter ID</label>
            <input type="text" id="voterID" value={voterID} onChange={(e) => setVoterID(e.target.value)} 
              className="form-control" placeholder="Enter Voter ID" required autoComplete="voter-id" />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} 
              className="form-control" placeholder="Enter Password" required autoComplete="current-password" />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-100 mb-3">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-center text-muted mb-0 small">
            No account? <Link href="/register" className="text-primary text-decoration-none fw-semibold">Register as voter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}