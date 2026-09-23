import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../services/firebase'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { StudentMartLogo } from '../components/StudentMartLogo'
import '../css/Auth.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login, user, authLoading, userRole } = useAuth()
  const navigate = useNavigate()

  // Redirect after login — admins land on the dashboard, students on the store
  useEffect(() => {
    if (!authLoading && user) {
      navigate(userRole === 'admin' ? '/admin/orders' : '/')
    }
  }, [user, userRole, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Don't navigate here, let the useEffect handle it
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    setForgotLoading(true)

    try {
      await sendPasswordResetEmail(auth, forgotEmail)
      setForgotSuccess('Password reset email sent! Check your inbox.')
      setForgotEmail('')
      setTimeout(() => {
        setShowForgotPassword(false)
        setForgotSuccess('')
      }, 3000)
    } catch (err) {
      setForgotError(getFriendlyErrorMessage(err))
      setForgotLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <StudentMartLogo markSize={34} textClassName="auth-brand-name" />
          <span className="auth-brand-tag">Campus pickup store</span>
        </div>
        <h2>Welcome back</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Signup</Link>
        </p>
        <button
          type="button"
          className="forgot-password-link"
          onClick={() => setShowForgotPassword(true)}
        >
          Forgot your password?
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Your Password</h3>
              <button
                className="modal-close"
                onClick={() => setShowForgotPassword(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotPassword}>
              <p className="modal-description">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {forgotError && <div className="error-message">{forgotError}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <div className="form-group">
                <label htmlFor="forgot-email">Email Address</label>
                <input
                  type="email"
                  id="forgot-email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="btn btn-primary btn-full1"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Email'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full1"
                onClick={() => setShowForgotPassword(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
