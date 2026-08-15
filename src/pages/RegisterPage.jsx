import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { StudentMartLogo } from '../components/StudentMartLogo'
import '../css/Auth.css'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, user, userRole, authLoading } = useAuth()
  const navigate = useNavigate()

  const role = 'student'
  // Redirect after register — admins land on the dashboard, students on the store
  useEffect(() => {
    if (!authLoading && user) {
      navigate(userRole === 'admin' ? '/admin/orders' : '/')
    }
  }, [user, userRole, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedStudentId = studentId.trim()
    if (!/^\d{1,10}$/.test(trimmedStudentId)) {
      setError('Enter a valid Student ID (numbers only, up to 10 digits).')
      return
    }

    setLoading(true)
    try {
      await register(email, password, displayName, role, trimmedStudentId)
      // Don't navigate here, let the useEffect handle it
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <StudentMartLogo markSize={34} textClassName="auth-brand-name" />
          <span className="auth-brand-tag">Campus pickup store</span>
        </div>
        <h2>Create an account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              type="text"
              id="studentId"
              inputMode="numeric"
              maxLength={10}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              placeholder="Enter your student ID (up to 10 digits)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password (min 6 characters)"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? 'Creating account...' : 'Signup'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}
