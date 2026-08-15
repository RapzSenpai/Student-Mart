import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import { AdminLayout } from './components/AdminLayout'
import { AdminOrdersDashboard } from './pages/AdminOrdersDashboard'
import { AdminProductsPage } from './pages/AdminProductsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { Profile } from './pages/Profile'
import { NotificationsPage } from './pages/NotificationsPage'
import { ChatWidget } from './components/ChatWidget'
import './css/App.css'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userRole, loading } = useAuth()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const showChat = !isAdminRoute

  // Admins live in the dashboard — never the landing/store pages
  useEffect(() => {
    if (loading) return
    if (user && userRole === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin/orders', { replace: true })
    }
  }, [loading, user, userRole, location.pathname, navigate])

  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/store" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/orders" replace />} />
            <Route path="orders" element={<AdminOrdersDashboard />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {showChat && <ChatWidget />}
    </>
  )
}

function App() {
  return <AppContent />
}

export default App
