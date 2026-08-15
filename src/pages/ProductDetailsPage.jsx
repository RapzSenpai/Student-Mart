import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Package, Minus, Plus, ArrowLeft } from 'lucide-react'
import '../css/ProductDetailsPage.css'

export function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')

  useEffect(() => {
    let active = true
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const snap = await getDoc(doc(db, 'products', id))
        if (!active) return
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() })
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        if (active) setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchProduct()
    return () => {
      active = false
    }
  }, [id])

  const stock = product?.stock
  const inStock = stock === undefined ? true : stock > 0
  const maxQty = stock === undefined ? 99 : stock
  const gallery = product?.imageUrls?.length
    ? product.imageUrls
    : product?.imageUrl
      ? [product.imageUrl]
      : []
  const availableSizes = Array.isArray(product?.sizes) ? product.sizes : []
  const needsSize = availableSizes.length > 0
  const stockStatus = !inStock
    ? 'error'
    : stock !== undefined && stock <= 5
      ? 'warning'
      : 'success'
  const stockText = !inStock
    ? 'Out of stock'
    : stock !== undefined && stock <= 5
      ? `Low stock: ${stock}`
      : 'In stock'
  const safeIdx = Math.min(activeImg, Math.max(0, gallery.length - 1))
  const activeImage = gallery[safeIdx] || gallery[0] || ''

  const increase = () => setQty((q) => Math.min(q + 1, maxQty))
  const decrease = () => setQty((q) => Math.max(q - 1, 1))

  const goLogin = () => navigate('/login')

  const handleAddToCart = () => {
    if (!user) return goLogin()
    if (needsSize && !selectedSize) return
    addToCart(product, qty, selectedSize)
    navigate('/cart')
  }

  const handleBuyNow = () => {
    if (!user) return goLogin()
    if (needsSize && !selectedSize) return
    addToCart(product, qty, selectedSize)
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-loading">Loading product…</div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="pd-page">
        <div className="pd-empty">
          <h2>Product not found</h2>
          <p>This item may have been removed.</p>
          <Link to="/store" className="btn btn-primary">
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pd-page">
      <div className="pd-container">
        <Link to="/store" className="pd-back">
          <ArrowLeft size={16} strokeWidth={1.8} /> Back to store
        </Link>

        <div className="pd-card">
          {/* ── Left / Top: image column ───────────────────────── */}
          <div className="pd-image-col">
            <div className="pd-image">
              {activeImage ? (
                <img src={activeImage} alt={product.name} />
              ) : (
                <div className="pd-image-placeholder">
                  <Package size={56} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="pd-thumbnails">
                {gallery.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pd-thumb ${idx === safeIdx ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={src} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right / Bottom: info panel ─────────────────────── */}
          <div className="pd-info">
            {/* Classification tag */}
            {(product.classification || product.category) && (
              <div className="pd-tags">
                <span
                  className={`pd-class-tag pd-class-${(product.classification || product.category || '')
                    .replace(/\s+/g, '-')
                    .toLowerCase()}`}
                >
                  {product.classification || product.category}
                </span>
              </div>
            )}

            {/* 1. Product name & price */}
            <h1 className="pd-name">{product.name}</h1>
            <p className="pd-price">₱{Number(product.price).toFixed(2)}</p>

            <div className="pd-divider" />

            {/* 2. Product description */}
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}

            {/* 2b. Size selection */}
            {needsSize && (
              <div className="pd-sizes">
                <span className="pd-qty-label">Select Size</span>
                <div className="pd-size-chips">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`pd-size-chip ${selectedSize === s ? 'is-selected' : ''}`}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {needsSize && !selectedSize && (
                  <span className="pd-size-hint">Please select a size</span>
                )}
              </div>
            )}

            {/* 3. Stock information */}
            <div className="pd-stock">
              <span className="pd-stock-label">Availability</span>
              <span className={`pd-stock-status is-${stockStatus}`}>
                <span className="pd-stock-dot" />
                {stockText}
              </span>
            </div>

            {/* Quantity picker */}
            {inStock && (
              <div className="pd-qty">
                <span className="pd-qty-label">Quantity</span>
                <div className="pd-qty-control">
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={decrease}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="pd-qty-value">{qty}</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={increase}
                    disabled={qty >= maxQty}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="pd-qty-hint">Max {maxQty}</span>
              </div>
            )}

            {/* 4. Buy Now + Add to Cart */}
            <div className="pd-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleBuyNow}
                disabled={!inStock || (needsSize && !selectedSize)}
              >
                Buy Now
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={handleAddToCart}
                disabled={!inStock || (needsSize && !selectedSize)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
