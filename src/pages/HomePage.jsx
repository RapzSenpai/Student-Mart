import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { ProductCard } from '../components/ProductCard'
import { PenLine, Shirt, Backpack, BookOpen, Package, Search } from 'lucide-react'
import { fetchCategories } from '../utils/categories'
import '../css/HomePage.css'

const CATEGORY_ICONS = {
  writing: PenLine,
  uniform: Shirt,
  accessories: Backpack,
  handbook: BookOpen,
}

export function HomePage() {
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const q = selectedCategory
        ? query(collection(db, 'products'), where('category', '==', selectedCategory))
        : query(collection(db, 'products'), orderBy('createdAt', 'desc'))

      const querySnapshot = await getDocs(q)
      const productList = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProducts(productList)
      if (!selectedCategory) setAllProducts(productList)
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const counts = useMemo(() => {
    const m = {}
    allProducts.forEach((p) => {
      m[p.category] = (m[p.category] || 0) + 1
    })
    return m
  }, [allProducts])

  const activeCategory = categories.find((c) => c.id === selectedCategory)

  return (
    <div className="home-page">
      <section className="store-hero">
        <div className="store-hero-inner">
          <h1>Campus essentials, ready for pickup</h1>
          <p>School supplies, uniforms, and handbooks — ordered online, collected on campus.</p>
          <div className="store-hero-search">
            <Search size={18} strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="store-section-head">
          <h2>{activeCategory ? `${activeCategory.name} Products` : 'All Products'}</h2>
          {selectedCategory && (
            <button
              type="button"
              className="store-link"
              onClick={() => setSelectedCategory(null)}
            >
              See all
            </button>
          )}
        </div>
        <div className="cat-rail">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] || Package
            const count = counts[category.id] || 0
            return (
              <button
                key={category.id}
                className={`cat-chip ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                }
              >
                <span className="cat-chip-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className="cat-chip-name">{category.name}</span>
                <span className="cat-chip-count">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="store-divider" />

        {loading && <div className="store-loading">Loading products…</div>}
        {error && <div className="store-error">{error}</div>}

        {!loading && filteredProducts.length === 0 && (
          <div className="store-empty">
            <p>No products found. Check back soon!</p>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(id) => navigate(`/product/${id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
