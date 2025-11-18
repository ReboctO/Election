'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ voterID: '', voterFname: '', voterLname: '', voterMname: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) router.push('/login?message=Registration successful! Please sign in.')
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <h2 className="display-5 fw-bold">Voter Registration</h2>
          <p className="text-muted">Create your voting account</p>
        </div>
        <div className="card shadow-sm p-4">
          {[
            { label: 'Voter ID', name: 'voterID', type: 'number', required: true },
            { label: 'First Name', name: 'voterFname', required: true },
            { label: 'Last Name', name: 'voterLname', required: true },
            { label: 'Middle Name (Optional)', name: 'voterMname' },
            { label: 'Password', name: 'password', type: 'password', required: true },
            { label: 'Confirm Password', name: 'confirmPassword', type: 'password', required: true }
          ].map(({ label, name, type = 'text', required }) => (
            <div key={name} className="mb-3">
              <label htmlFor={name} className="form-label">{label}</label>
              <input type={type} id={name} name={name} value={formData[name]} 
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} 
                className="form-control" required={required} />
            </div>
          ))}
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-100 mb-3">
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="text-center text-muted mb-0 small">
            Already have an account? <Link href="/login" className="text-primary text-decoration-none fw-semibold">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}