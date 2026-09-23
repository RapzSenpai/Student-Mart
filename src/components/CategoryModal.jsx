import React, { useState } from 'react'
import { X, Plus, Trash2, Tag, AlertCircle } from 'lucide-react'
import { addCategory, removeCategory } from '../utils/categories'
import '../css/CategoryModal.css'

export function CategoryModal({ isOpen, categories, onClose, onCategoriesUpdated, products = [] }) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAdd = async (e) => {
    e?.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return

    try {
      setLoading(true)
      setError('')
      await addCategory(name)
      setNewCategoryName('')
      await onCategoriesUpdated()
    } catch (err) {
      setError('Could not add category: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (cat) => {
    const attachedCount = products.filter((p) => p.category === cat.id).length
    if (attachedCount > 0) {
      if (
        !window.confirm(
          `Category "${cat.name}" has ${attachedCount} product(s) assigned. Removing it may affect filtering. Proceed?`,
        )
      ) {
        return
      }
    } else if (!window.confirm(`Delete category "${cat.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      setError('')
      await removeCategory(cat.id)
      await onCategoriesUpdated()
    } catch (err) {
      setError('Could not remove category: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="category-modal-title">
            <Tag size={20} />
            <h2>Manage Categories</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="category-modal-body">
          <form onSubmit={handleAdd} className="category-add-form">
            <input
              type="text"
              placeholder="e.g. Uniforms, Textbooks, Art"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !newCategoryName.trim()}>
              <Plus size={16} />
              Add
            </button>
          </form>

          <div className="category-list-wrap">
            <label className="category-list-label">Existing Categories ({categories.length})</label>
            <ul className="category-list">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length
                return (
                  <li key={cat.id} className="category-item">
                    <div className="category-item-info">
                      <span className="category-item-name">{cat.name}</span>
                      <span className="category-item-count">{count} {count === 1 ? 'item' : 'items'}</span>
                    </div>
                    <button
                      type="button"
                      className="category-delete-btn"
                      onClick={() => handleRemove(cat)}
                      disabled={loading}
                      title={`Delete ${cat.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                )
              })}
              {categories.length === 0 && (
                <li className="category-empty">No categories found.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="category-modal-actions">
          <button type="button" className="btn btn-secondary category-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
