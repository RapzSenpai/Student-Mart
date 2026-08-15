import React, { useState } from 'react'
import '../css/SizeSelector.css'

export function SizeSelector({ product, onClose, onSelectSize }) {
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size')
      return
    }

    onSelectSize({
      ...product,
      selectedSize,
      quantity,
    })
  }

  return (
    <div className="size-selector-overlay" onClick={onClose}>
      <div className="size-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="size-modal-header">
          <h2>Select Size</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="size-modal-content">
          <div className="product-preview">
            <img src={product.imageUrl} alt={product.name} />
            <div className="product-info-preview">
              <h3>{product.name}</h3>
              <p className="price">₱{product.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="size-selection">
            <label className="section-label">Choose Size:</label>
            <div className="size-options">
              {product.sizes && product.sizes.map((sizeItem) => (
                <button
                  key={sizeItem.size}
                  className={`size-option ${selectedSize === sizeItem.size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(sizeItem.size)}
                  disabled={sizeItem.stock <= 0}
                >
                  <span className="size-name">{sizeItem.size}</span>
                  <span className="size-stock">
                    {sizeItem.stock > 0 ? `${sizeItem.stock} in stock` : 'Out of stock'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="quantity-section">
            <label className="section-label">Quantity:</label>
            <div className="quantity-control">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="qty-btn"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, val))
                }}
                min="1"
                className="qty-input"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="size-modal-actions">
            <button
              className="btn-add"
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              Add to Cart
            </button>
            <button
              className="btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
