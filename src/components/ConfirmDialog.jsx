import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import '../css/ConfirmDialog.css'

export function ConfirmDialog({
  isOpen,
  title = 'Add to cart?',
  message,
  product,
  quantity = 1,
  size = '',
  confirmLabel = 'Add',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const image = product?.imageUrls?.[0] || product?.imageUrl || ''
  const total = product ? Number(product.price || 0) * quantity : 0

  return createPortal(
    <div className="confirm-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
          {product && (
            <div className="confirm-product">
              {image ? (
                <img src={image} alt={product.name} className="confirm-thumb" />
              ) : null}
              <div className="confirm-product-info">
                <span className="confirm-product-name">{product.name}</span>
                <span className="confirm-product-meta">
                  {quantity} × ₱{Number(product.price || 0).toFixed(2)}
                  {size ? ` · Size: ${size}` : ''}
                </span>
                <span className="confirm-product-total">Total: ₱{total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
