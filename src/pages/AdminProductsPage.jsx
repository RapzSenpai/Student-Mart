import React, { useState, useEffect, useCallback } from 'react'
import { db } from '../services/firebase'
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { ProductModal } from '../components/ProductModal'
import { CategoryModal } from '../components/CategoryModal'
import { fetchCategories, DEFAULT_CATEGORIES } from '../utils/categories'
import { Package, Plus, Pencil, Trash2, Search, Tags } from 'lucide-react'
import '../css/AdminProductsPage.css'

export function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  const reloadCategories = useCallback(async () => {
    try {
      const list = await fetchCategories()
      setCategories(list)
    } catch {
      // keep current
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProducts(list)
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    reloadCategories()
  }, [fetchProducts, reloadCategories])

  const handleAdd = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'products', product.id))
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch (err) {
      console.error('Error deleting product:', err)
      setError('Failed to delete product.')
    }
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="admin-products">
      <header className="ap-head">
        <div>
          <h1>Products</h1>
          <p className="ap-sub">Manage the store catalog, pricing, and stock.</p>
        </div>
        <div className="ap-head-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCategoryModalOpen(true)}
          >
            <Tags size={16} strokeWidth={2} />
            Manage Categories
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} strokeWidth={2} />
            Add Product
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ap-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <Package size={36} strokeWidth={1.5} />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="ap-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = p.stock
                const stockStatus =
                  stock === undefined
                    ? 'muted'
                    : stock <= 0
                      ? 'error'
                      : stock <= 5
                        ? 'warning'
                        : 'success'
                const stockText =
                  stock === undefined ? '—' : stock <= 0 ? 'Out' : `${stock}`
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="ap-product">
                        <div className="ap-thumb">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} />
                          ) : (
                            <Package size={16} strokeWidth={1.6} />
                          )}
                        </div>
                        <div>
                          <p className="ap-name">{p.name}</p>
                          {p.classification && (
                            <span className="ap-class">{p.classification}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="ap-cat">
                      {categories.find((c) => c.id === p.category)?.name || p.category || '—'}
                    </td>
                    <td>₱{Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`pd-stock-status is-${stockStatus}`}>
                        <span className="pd-stock-dot" />
                        {stockText}
                      </span>
                    </td>
                    <td className="ap-actions-col">
                      <button
                        type="button"
                        className="ap-icon-btn"
                        onClick={() => handleEdit(p)}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil size={16} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="ap-icon-btn danger"
                        onClick={() => handleDelete(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 size={16} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        isOpen={modalOpen}
        category={editingProduct ? editingProduct.category : ''}
        editingProduct={editingProduct}
        onClose={() => setModalOpen(false)}
        onProductAdded={fetchProducts}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        categories={categories}
        products={products}
        onClose={() => setCategoryModalOpen(false)}
        onCategoriesUpdated={reloadCategories}
      />
    </div>
  )
}
