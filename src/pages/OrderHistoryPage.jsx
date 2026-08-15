import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { Package, MapPin, ClipboardList, ShoppingBag, ChevronDown, X } from 'lucide-react'
import { displayOrderRef } from '../utils/orders'
import '../css/OrderHistoryPage.css'

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatDate(ts) {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isTerminalOrder = (status) =>
  status === 'completed' || status === 'cancelled'

export function OrderHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setOrders(list)
        setExpandedId(list.length ? list[0].id : null)
        setError('')
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Could not load your orders. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  const handleCancelClick = (orderId) => {
    setCancellingOrderId(orderId)
    setShowCancelModal(true)
    setCancelError('')
  }

  const handleConfirmCancel = async () => {
    if (!cancellingOrderId) return

    try {
      const orderRef = doc(db, 'orders', cancellingOrderId)
      await updateDoc(orderRef, { status: 'cancelled' })

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === cancellingOrderId ? { ...order, status: 'cancelled' } : order,
        ),
      )

      setCancelSuccess('Order cancelled successfully')
      setShowCancelModal(false)
      setCancellingOrderId(null)

      setTimeout(() => setCancelSuccess(''), 3000)
    } catch (err) {
      console.error('Error cancelling order:', err)
      setCancelError('Failed to cancel order. Please try again.')
    }
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setCancellingOrderId(null)
    setCancelError('')
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-inner">
          <div className="loading">Loading your orders…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="orders-inner">
        <header className="orders-head">
          <h1>
            <ClipboardList size={26} strokeWidth={1.8} />
            Order History
          </h1>
          <p className="orders-sub">Your on-campus pickup orders</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        {!error && orders.length === 0 && (
          <div className="orders-empty">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <h2>No orders yet</h2>
            <p>When you place an order, it will show up here.</p>
            <Link to="/store" className="btn btn-primary btn-full">
              Browse the Store
            </Link>
          </div>
        )}

        {orders.map((order) => {
          const status = order.status || 'pending'
          const label = STATUS_LABEL[status] || status
          const total = Number(order.totalAmount || 0)
          const items = order.items || []
          const itemCount = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0)
          const isOpen = expandedId === order.id
          return (
            <article key={order.id} className={`order-card ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="order-summary"
                onClick={() => setExpandedId(isOpen ? null : order.id)}
                aria-expanded={isOpen}
              >
                <span className={`order-status-dot status-${status}`} />
                <span className="order-summary-main">
                  <span className="order-ref">{displayOrderRef(order)}</span>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </span>
                <span className={`order-status status-${status}`}>{label}</span>
                <span className="order-count">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
                <span className="order-total-mini">₱{total.toFixed(2)}</span>
                <ChevronDown size={18} strokeWidth={2} className="order-chevron" />
              </button>

              {isOpen && (
                <div className="order-details">
                  <div className="order-items">
                    {items.map((item, idx) => (
                      <div key={`${order.id}-${item.productId || idx}`} className="order-item">
                        <div className="order-item-thumb">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <Package size={18} strokeWidth={1.6} />
                          )}
                        </div>
                        <div className="order-item-info">
                          <p className="order-item-name">{item.name}</p>
                          <p className="order-item-meta">
                            {item.size ? `Size ${item.size} · ` : ''}₱{Number(item.price).toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <p className="order-item-sub">
                          ₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="order-foot">
                    <div className="order-pickup">
                      <MapPin size={14} strokeWidth={2} />
                      <span>
                        Pickup: {order.pickupLocation === 'annex' ? 'Annex Building' : order.pickupLocation === 'main-campus' ? 'Main Campus' : (order.pickupLocation || 'Accounting Office')}
                      </span>
                    </div>
                    <div className="order-foot-right">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          className="btn-cancel-order"
                          onClick={() => handleCancelClick(order.id)}
                        >
                          Cancel Order
                        </button>
                      )}
                      <div className="order-total">
                        <span>Total</span>
                        <span>₱{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {cancelSuccess && <div className="success-message">{cancelSuccess}</div>}
      </div>

      {showCancelModal && (
        <div className="modal-overlay" onClick={handleCloseCancelModal}>
          <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Order?</h3>
              <button className="modal-close" onClick={handleCloseCancelModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <p className="warning-text">
                This action cannot be undone. Your order will be marked as cancelled.
              </p>

              {cancelError && <div className="error-message">{cancelError}</div>}

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={handleCloseCancelModal}>
                  Keep Order
                </button>
                <button className="btn btn-danger" onClick={handleConfirmCancel}>
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
