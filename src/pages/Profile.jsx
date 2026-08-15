import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { LogOut, ShoppingBag, Package, ChevronDown, Wallet, Clock, CheckCircle2 } from 'lucide-react'
import { displayOrderRef } from '../utils/orders'
import '../css/Profile.css'

const isTerminalOrder = (status) =>
  status === 'completed' || status === 'cancelled'

export function Profile() {
  const { user, userRole, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [expandedIds, setExpandedIds] = useState({})

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchUserData()
    fetchOrders()
  }, [user, navigate])

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        setDisplayName(userDocSnap.data().displayName || 'User')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)
      const ordersList = []

      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      // Sort by date descending
      ordersList.sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)))
      setOrders(ordersList)
      setError('')
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getOrderStats = () => {
    const nonCancelled = orders.filter((o) => o.status !== 'cancelled')
    const totalOrders = orders.length
    const totalSpent = nonCancelled.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    )
    const active = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed',
    ).length
    const completed = orders.filter((o) => o.status === 'completed').length
    return { totalOrders, totalSpent, active, completed }
  }

  const stats = getOrderStats()

  return (
    <div className="profile-page">
      <div className="profile-container">
        <section className="profile-card">
          <div className="profile-avatar">
            {displayName ? displayName.charAt(0).toUpperCase() : <UserPlaceholder />}
          </div>
          <div className="profile-id">
            <h1>{displayName}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className={`profile-role ${userRole === 'admin' ? 'is-admin' : ''}`}>
              {userRole === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>
          <button onClick={handleLogout} className="profile-logout">
            <LogOut size={16} strokeWidth={1.8} />
            Logout
          </button>
        </section>

        <section className="profile-stats">
          <div className="stat-card">
            <span className="stat-icon">
              <ShoppingBag size={20} strokeWidth={1.8} />
            </span>
            <div className="stat-body">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats.totalOrders}</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              <Wallet size={20} strokeWidth={1.8} />
            </span>
            <div className="stat-body">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">₱{stats.totalSpent.toFixed(2)}</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              <Clock size={20} strokeWidth={1.8} />
            </span>
            <div className="stat-body">
              <span className="stat-label">Active</span>
              <span className="stat-value">{stats.active}</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              <CheckCircle2 size={20} strokeWidth={1.8} />
            </span>
            <div className="stat-body">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completed}</span>
            </div>
          </div>
        </section>

        <section className="profile-orders">
          <div className="profile-orders-head">
            <h2>
              <ShoppingBag size={20} strokeWidth={1.8} />
              Your Orders
            </h2>
            {orders.length > 0 && <span className="profile-orders-count">{orders.length}</span>}
          </div>

          {loading && <div className="loading">Loading orders...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && orders.length === 0 && (
            <div className="empty-state">
              <Package size={32} strokeWidth={1.5} />
              <p>No orders yet. Start shopping!</p>
              <button className="btn btn-primary" onClick={() => navigate('/store')}>
                Browse Store
              </button>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => {
                const isExpanded = expandedIds[order.id] ?? !isTerminalOrder(order.status)
                const toggleOrder = () =>
                  setExpandedIds((prev) => ({ ...prev, [order.id]: !isExpanded }))

                return (
                  <div
                    key={order.id}
                    className={`order-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
                  >
                    <button
                      type="button"
                      className="order-summary"
                      onClick={toggleOrder}
                      aria-expanded={isExpanded}
                    >
                      <div className="order-summary-main">
                        <span className="order-id">
                          {displayOrderRef(order)}
                        </span>
                        <span className={`order-status status-${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-summary-meta">
                        <span className="order-summary-total">
                          ₱{order.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                        <span className="order-summary-date">{formatDate(order.createdAt)}</span>
                        <ChevronDown size={18} strokeWidth={1.8} className="order-chevron" />
                      </div>
                    </button>

                    <div className="order-collapse">
                      <div className="order-collapse-inner">
                        <div className="order-details">
                          <div className="order-meta">
                            <span className="order-meta-label">Date</span>
                            <span className="order-meta-value">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="order-meta">
                            <span className="order-meta-label">Items</span>
                            <span className="order-meta-value">{order.items?.length || 0}</span>
                          </div>
                          {order.paymentMethod && (
                            <div className="order-meta">
                              <span className="order-meta-label">Payment</span>
                              <span className="order-meta-value">{order.paymentMethod}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function UserPlaceholder() {
  return <span className="profile-avatar-fallback">U</span>
}
