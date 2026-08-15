import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Package } from 'lucide-react'
import '../css/ProductCard.css'

export function ProductCard({ product, onViewDetails }) {
  const { user } = useAuth()
  const { addToCart, cart } = useCart()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = useState(false)

  const stock = product.stock
  const inStock = stock === undefined ? true : stock > 0
  const lowStock = stock !== undefined && stock > 0 && stock <= 5
  const outOfStock = stock !== undefined && stock <= 0
  const cartQty = cart.find((i) => i.id === product.id)?.quantity || 0
  const atMax = stock !== undefined && cartQty >= stock
  const primaryImage = product.imageUrls?.[0] || product.imageUrl

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isAdding) return
    if ((product.sizes?.length ?? 0) > 0) {
      if (onViewDetails) onViewDetails(product.id)
      return
    }
    setIsAdding(true)
    addToCart(product)
    setTimeout(() => setIsAdding(false), 800)
  }

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (onViewDetails) onViewDetails(product.id)
  }

  const stockStatus = outOfStock ? 'error' : lowStock ? 'warning' : 'success'
  const stockText = outOfStock
    ? 'Out of stock'
    : lowStock
      ? `Low stock${stock !== undefined ? `: ${stock}` : ''}`
      : 'In stock'

  return (
    <div className="card product-card">
      <figure className="product-figure">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            <Package size={40} strokeWidth={1.5} />
          </div>
        )}
      </figure>

      <div className="product-body">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          {product.classification && (
            <span className={`pd-class-tag pd-class-${product.classification.toLowerCase()}`}>
              {product.classification}
            </span>
          )}
        </div>

        <p className="product-price">₱{Number(product.price).toFixed(2)}</p>

        <div className="product-meta">
          <span className={`pd-stock-status is-${stockStatus}`}>
            <span className="pd-stock-dot" />
            {stockText}
          </span>
        </div>

        <div className="product-spacer" />

        <div className="card-actions product-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleAddToCart}
            disabled={!inStock || atMax || isAdding}
            title={atMax ? `Max ${stock} in cart` : undefined}
          >
            {atMax ? 'Max in cart' : isAdding ? 'Adding…' : 'Add to Cart'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleBuyNow}
            disabled={!inStock}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
