import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ShoppingCart, Package, Minus, Plus, Trash2, ArrowRight, Store, Check } from 'lucide-react'
import '../css/CartPage.css'

export function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart()
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState({})
  const [showClearModal, setShowClearModal] = useState(false)

  // Silently redirect admin users away from cart page
  useEffect(() => {
    if (user && userRole === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, userRole, navigate])

  const toggleSelect = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const allSelected = cart.length > 0 && cart.every((i) => selected[i.id])
  const selectedCount = Object.values(selected).filter(Boolean).length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected({})
    } else {
      setSelected(Object.fromEntries(cart.map((i) => [i.id, true])))
    }
  }

  const handleRemoveSelected = () => {
    cart.filter((i) => selected[i.id]).forEach((i) => removeFromCart(i.id))
    setSelected({})
  }

  const handleClearAll = () => {
    clearCart()
    setSelected({})
    setShowClearModal(false)
  }

  if (!user) {
    return (
      <div className="cart-page">
        <div className="cart-state">
          <ShoppingCart size={40} strokeWidth={1.5} />
          <h2>Please log in to view your cart</h2>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-full">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-state">
          <ShoppingCart size={40} strokeWidth={1.5} />
          <h2>Your Cart is Empty</h2>
          <p>Browse the store and add items for pickup.</p>
          <Link to="/store" className="btn btn-primary btn-full">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const selectedItems = cart.filter((i) => selected[i.id])
  const total = selectedItems.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0,
  )

  return (
    <div className="cart-page">
      <div className="cart-inner">
        <header className="cart-head">
          <div className="cart-head-title">
            <ShoppingCart size={26} strokeWidth={1.8} />
            <h1>Shopping Cart</h1>
          </div>
          <span className="cart-count-chip">
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </span>
        </header>

        <div className="cart-toolbar">
          <label className="cart-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              aria-label="Select all items"
            />
            <span>Select all</span>
          </label>
          <div className="cart-toolbar-actions">
            <button
              type="button"
              className="cart-btn cart-btn-remove"
              onClick={handleRemoveSelected}
              disabled={selectedCount === 0}
            >
              <Trash2 size={15} strokeWidth={1.8} />
              Remove selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>
            <button
              type="button"
              className="cart-btn cart-btn-clear"
              onClick={() => setShowClearModal(true)}
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="cart-layout">
          <section className="cart-list">
            {cart.map((item) => (
              <article key={`${item.id}-${item.size || ''}`} className={`cart-row ${selected[item.id] ? 'is-selected' : ''}`}>
                <label className="cart-check" aria-label={`Select ${item.name}`}>
                  <input
                    type="checkbox"
                    checked={!!selected[item.id]}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <span className="cart-check-box"><Check size={12} strokeWidth={3} /></span>
                </label>

                <div className="cart-thumb">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <Package size={32} strokeWidth={1.5} />
                  )}
                </div>

                <div className="cart-meta">
                  <h3 className="cart-name">{item.name}</h3>
                  <p className="cart-unit">₱{Number(item.price).toFixed(2)} each</p>
                  {item.size ? <p className="cart-size">Size: {item.size}</p> : null}
                  {item.description && <p className="cart-desc">{item.description}</p>}
                </div>

                <div className="cart-qty">
                  <span className="cart-qty-label">Qty</span>
                  <div className="cart-stepper">
                    <button
                      type="button"
                      className="cart-step"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10)
                        if (!Number.isNaN(qty) && qty > 0) {
                          updateQuantity(item.id, qty)
                        }
                      }}
                      min="1"
                      className="cart-qty-input"
                      aria-label={`${item.name} quantity`}
                    />
                    <button
                      type="button"
                      className="cart-step"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.stock !== undefined && item.stock !== null && item.quantity >= item.stock}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {item.stock !== undefined && item.stock !== null && (
                    <span className="cart-stock-hint">
                      {item.quantity >= item.stock ? `Max ${item.stock} in stock` : `${item.stock} in stock`}
                    </span>
                  )}
                </div>

                <div className="cart-sub">
                  <span className="cart-sub-label">Subtotal</span>
                  <span className="cart-sub-val">
                    ₱{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="sum-row">
              <span>Subtotal</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <div className="sum-note">
              <Store size={14} strokeWidth={1.8} />
              Pickup in store — no shipping fees.
            </div>

            <div className="sum-divider"></div>

            <div className="sum-row sum-total">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate('/checkout', { state: { items: selectedItems } })}
              disabled={selectedCount === 0}
            >
              Proceed to Checkout
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            {selectedCount === 0 && (
              <p className="cart-checkout-hint">Select one or more items to checkout.</p>
            )}

            <Link to="/store" className="btn btn-secondary btn-full">
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>

      {showClearModal && (
        <div className="cart-confirm-overlay" onClick={() => setShowClearModal(false)}>
          <div className="cart-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-confirm-header">
              <h3>Clear your cart?</h3>
              <button className="modal-close" onClick={() => setShowClearModal(false)}>×</button>
            </div>
            <div className="cart-confirm-body">
              <p>This removes every item from your cart. You can add them again later.</p>
            </div>
            <div className="cart-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
                Keep cart
              </button>
              <button className="btn btn-danger" onClick={handleClearAll}>
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
