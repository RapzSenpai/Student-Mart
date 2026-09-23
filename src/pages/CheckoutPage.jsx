import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { db } from '../services/firebase'
import {
  collection,
  doc,
  serverTimestamp,
  getDocs,
  runTransaction,
} from 'firebase/firestore'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { generateOrderNumber } from '../utils/orders'
import { notifyNewOrder } from '../services/notifications'
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Wallet,
  MapPin,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react'
import '../css/CheckoutPage.css'

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, removeFromCart, updateItemPrice } = useCart()
  const { user, userRole } = useAuth()
  const checkoutItems = location.state?.items ?? cart
  const [loading, setLoading] = useState(false)
  const [priceChanges, setPriceChanges] = useState([])
  const [showPriceWarning, setShowPriceWarning] = useState(false)
  const [checkingPrices, setCheckingPrices] = useState(true)

  // Silently redirect admin users away from checkout page
  useEffect(() => {
    if (user && userRole === 'admin') {
      navigate('/', { replace: true })
    }
  }, [user, userRole, navigate])

  // Check for price changes when checkout page loads
  useEffect(() => {
    const checkPriceChanges = async () => {
      if (checkoutItems.length === 0) {
        setCheckingPrices(false)
        return
      }

      try {
        const changes = []

        // Fetch all products once instead of per-item
        const productsRef = collection(db, 'products')
        const snapshot = await getDocs(productsRef)
        const productMap = {}
        snapshot.docs.forEach((doc) => {
          productMap[doc.id] = { id: doc.id, ...doc.data() }
        })

        for (const item of checkoutItems) {
          const currentProduct = productMap[item.id]

          if (currentProduct && currentProduct.price !== item.price) {
            changes.push({
              productId: item.id,
              productName: item.name,
              oldPrice: item.price,
              newPrice: currentProduct.price,
              quantity: item.quantity,
              oldSubtotal: item.price * item.quantity,
              newSubtotal: currentProduct.price * item.quantity,
            })
          }
        }

        if (changes.length > 0) {
          setPriceChanges(changes)
          setShowPriceWarning(true)
        }
      } catch (err) {
        console.error('Error checking price changes:', err)
      } finally {
        setCheckingPrices(false)
      }
    }

    if (checkoutItems.length > 0) {
      checkPriceChanges()
    }
  }, [checkoutItems])

  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    address: 'Campus Pickup',
    pickupLocation: 'Accounting Office',
    notes: '',
  })

  // Calculate price differences
  const totalOldPrice = priceChanges.reduce((sum, change) => sum + change.oldSubtotal, 0)
  const totalNewPrice = priceChanges.reduce((sum, change) => sum + change.newSubtotal, 0)
  const priceDifference = totalNewPrice - totalOldPrice

  const handleAcceptPriceChange = () => {
    // Update cart items with new prices
    priceChanges.forEach((change) => {
      updateItemPrice(change.productId, change.newPrice)
    })
    // Reset price changes state to reflect new prices
    setPriceChanges([])
    setShowPriceWarning(false)
  }

  const handleRejectPriceChange = () => {
    navigate('/cart')
  }

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-state">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <h2>Please log in to checkout</h2>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-full">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-state">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <h2>Your cart is empty</h2>
            <p>Add items to place an order for pickup.</p>
            <Link to="/store" className="btn btn-primary btn-full">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="order-confirmation">
            <div className="confirmation-icon">
              <CheckCircle2 size={44} strokeWidth={2} />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order</p>
            <div className="order-id-box">
              <p className="order-id-label">Order ID</p>
              <p className="order-id-text">{orderId}</p>
            </div>
            <div className="confirmation-message">
              <p>
                Your order is being prepared. Please bring the exact cash amount when you pick
                up at campus.
              </p>
            </div>
            <button onClick={() => navigate('/')} className="btn btn-primary btn-full">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (checkoutItems.length === 0) {
      setError('Cart is empty')
      return
    }

    setLoading(true)

    try {
      const orderRef = doc(collection(db, 'orders'))

      // Server-side stock validation + atomic decrement via Firestore transaction.
      // Re-reads live stock at commit time so stale cart quantities are caught,
      // and serializes concurrent checkouts on the same product.
      await runTransaction(db, async (tx) => {
        const refs = checkoutItems.map((item) => doc(db, 'products', item.id))
        const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)))

        const orderItems = []
        const insufficient = []

        snapshots.forEach((snap, i) => {
          const item = checkoutItems[i]
          const data = snap.exists() ? snap.data() : null
          const hasStock = data && typeof data.stock === 'number'
          const available = hasStock ? data.stock : Infinity

          if (available < item.quantity) {
            insufficient.push({
              name: item.name,
              available: hasStock ? data.stock : 0,
              requested: item.quantity,
            })
          }

          orderItems.push({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size || '',
            image: item.imageUrl || item.image,
          })
        })

        if (insufficient.length > 0) {
          const detail = insufficient
            .map(
              (s) =>
                `"${s.name}" has ${s.available} left (you ordered ${s.requested})`,
            )
            .join('; ')
          throw new Error(`Stock changed: ${detail}`)
        }

        snapshots.forEach((snap, i) => {
          const item = checkoutItems[i]
          const data = snap.data()
          if (data && typeof data.stock === 'number') {
            tx.update(refs[i], { stock: data.stock - item.quantity })
          }
        })

        const orderData = {
          userId: user.uid,
          userEmail: user.email,
          deliveryAddress: formData.address,
          pickupLocation: formData.pickupLocation,
          notes: formData.notes,
          items: orderItems,
          totalAmount: checkoutItems.reduce(
            (sum, i) => sum + Number(i.price) * Number(i.quantity),
            0,
          ),
          paymentMethod: 'cash-on-pickup',
          status: 'pending',
          orderNumber: generateOrderNumber(),
          createdAt: serverTimestamp(),
        }

        tx.set(orderRef, orderData)
      })

      try {
        await notifyNewOrder({
          id: orderRef.id,
          userEmail: user.email,
          status: 'pending',
        })
      } catch (notifErr) {
        console.error('Failed to send order notification:', notifErr)
      }

      // Remove only the items that were checked out; keep the rest in the cart.
      checkoutItems.forEach((i) => removeFromCart(i.id))
      setOrderId(orderRef.id)
      setOrderPlaced(true)
    } catch (err) {
      console.error('Error placing order:', err)
      const msg = err.message || ''
      if (msg.startsWith('Stock changed:')) {
        setError(`Some items are no longer available. ${msg.replace('Stock changed: ', '')}. Please review your cart.`)
      } else {
        setError('Failed to place order. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = checkoutItems.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0,
  )

  return (
    <>
      {/* Price Change Warning Modal */}
      {showPriceWarning && priceChanges.length > 0 && (
        <div className="modal-overlay" onClick={handleRejectPriceChange}>
          <div className="modal-content price-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <AlertTriangle size={18} strokeWidth={2} />
                Price Change Alert
              </h3>
              <button className="modal-close" onClick={handleRejectPriceChange} aria-label="Close">
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="price-warning-content">
              <p>We've detected price changes in your cart since you added these items.</p>

              <div className="price-changes-list">
                {priceChanges.map((change) => (
                  <div key={change.productId} className="price-change-item">
                    <div className="price-change-info">
                      <p className="product-name">{change.productName}</p>
                      <p className="price-change-details">
                        Qty: {change.quantity} | Old: ₱{change.oldPrice.toFixed(2)} → New: ₱
                        {change.newPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="price-change-amount">
                      <p className="old-subtotal">₱{change.oldSubtotal.toFixed(2)}</p>
                      <p
                        className={`new-subtotal ${
                          change.newPrice > change.oldPrice ? 'price-increase' : 'price-decrease'
                        }`}
                      >
                        ₱{change.newSubtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="price-warning-summary">
                <div className="summary-row">
                  <span>Original Total:</span>
                  <span className="old-price">₱{(totalPrice - priceDifference).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>New Total:</span>
                  <span
                    className={`new-price ${
                      priceDifference > 0 ? 'price-increase' : 'price-decrease'
                    }`}
                  >
                    ₱{totalPrice.toFixed(2)}
                  </span>
                </div>
                {priceDifference !== 0 && (
                  <div className="summary-row difference">
                    <span>Difference:</span>
                    <span className={priceDifference > 0 ? 'price-increase' : 'price-decrease'}>
                      {priceDifference > 0 ? '+' : ''}₱{priceDifference.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <p className="warning-message">
                You will be charged based on the <strong>current prices</strong> shown above. Would
                you like to proceed or go back to review your cart?
              </p>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={handleRejectPriceChange}>
                  Back to Cart
                </button>
                <button className="btn btn-primary" onClick={handleAcceptPriceChange}>
                  Proceed with Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-page">
        <div className="checkout-inner">
          <header className="checkout-head">
            <button
              type="button"
              className="checkout-back"
              onClick={() => navigate('/cart')}
              aria-label="Back to cart"
            >
              <ArrowLeft size={18} strokeWidth={2} />
              Back to Cart
            </button>
            <h1>Checkout</h1>
          </header>

          {checkingPrices && checkoutItems.length > 0 && (
            <div className="checkout-loading">
              <p>Verifying product prices…</p>
            </div>
          )}

          {!checkingPrices && showPriceWarning && priceChanges.length > 0 ? null : (
            <div className="checkout-wrapper">
              {/* Checkout Form */}
              <div className="checkout-form-section">
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handlePlaceOrder}>
                  {/* Pickup Information */}
                  <fieldset className="form-section">
                    <h4>
                      <MapPin size={16} strokeWidth={2} />
                      Pickup Information
                    </h4>

                    <div className="form-group">
                      <label>Pickup Location</label>
                      <div className="pickup-fixed">
                        <MapPin size={16} strokeWidth={2} />
                        <span>{formData.pickupLocation}</span>
                      </div>
                      <p className="form-hint">
                        Your order will be available for collection at the Accounting Office.
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="notes">Notes for Pickup (optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="e.g. preferred pickup time, contact details"
                      />
                    </div>
                  </fieldset>

                  {/* Payment Method */}
                  <fieldset className="form-section">
                    <h4>Payment Method</h4>
                    <div className="payment-method">
                      <div className="payment-option selected">
                        <input type="radio" id="payment-cash" name="payment" value="cash" checked readOnly />
                        <label htmlFor="payment-cash" className="payment-info">
                          <p className="payment-name">
                            <Wallet size={16} strokeWidth={2} />
                            Cash on Pickup
                          </p>
                          <p className="payment-description">
                            Pay the exact amount when you collect your order on campus.
                          </p>
                        </label>
                      </div>
                    </div>
                  </fieldset>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/cart')}
                      disabled={loading}
                    >
                      Back to Cart
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Placing Order…' : 'Place Order'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Order Summary */}
              <aside className="order-summary-section">
                <h2>
                  <ShoppingBag size={18} strokeWidth={2} />
                  Order Summary
                </h2>

                <div className="summary-items">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="summary-item">
                      <div className="item-image">
                        {item.imageUrl || item.image ? (
                          <img src={item.imageUrl || item.image} alt={item.name} />
                        ) : (
                          <ShoppingBag size={20} strokeWidth={1.6} />
                        )}
                      </div>
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        <p className="item-qty">
                          ₱{Number(item.price).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="item-subtotal">
                        ₱{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="total-row final">
                    <span>Total</span>
                    <span>₱{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="summary-pickup">
                  <MapPin size={14} strokeWidth={2} />
                  Pick up at campus — pay on pickup. No shipping fees.
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
