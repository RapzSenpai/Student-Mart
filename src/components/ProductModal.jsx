import React, { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { X, Plus, ImagePlus, Trash2 } from 'lucide-react'
import { fetchCategories, addCategory, removeCategory } from '../utils/categories'
import '../css/ProductModal.css'

const CLASSIFICATION_OPTIONS = ['Required', 'Recommended', 'Optional', 'Bundle']

export function ProductModal({ isOpen, category, editingProduct, onClose, onProductAdded }) {
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('10')
  const [classification, setClassification] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [modalCategory, setModalCategory] = useState('writing')
  const [categories, setCategories] = useState([])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [sizes, setSizes] = useState([])
  const [sizeInput, setSizeInput] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      const list = await fetchCategories()
      setCategories(list)
      setModalCategory((prev) =>
        prev && list.some((c) => c.id === prev)
          ? prev
          : category || (editingProduct && editingProduct.category) || list[0]?.id || '',
      )
    }

    if (category) {
      setModalCategory(category)
    }

    if (editingProduct) {
      setProductName(editingProduct.name || '')
      setPrice(editingProduct.price || '')
      setDescription(editingProduct.description || '')
      setStock(editingProduct.stock || '10')
      setClassification(editingProduct.classification || '')
      setSizes(Array.isArray(editingProduct.sizes) ? editingProduct.sizes : [])
      setSizeInput('')
      const existing =
        editingProduct.imageUrls && editingProduct.imageUrls.length
          ? editingProduct.imageUrls
          : editingProduct.imageUrl
            ? [editingProduct.imageUrl]
            : []
      setImageUrls(existing)
      setImageFiles([])
      setImagePreviews([])
    } else {
      resetForm()
    }

    if (isOpen) loadCategories()
  }, [editingProduct, isOpen, category])

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  const resetForm = () => {
    setProductName('')
    setPrice('')
    setDescription('')
    setStock('10')
    setClassification('')
    setImageFiles([])
    setImageUrls([])
    setImagePreviews([])
    setSizes([])
    setSizeInput('')
    setError('')
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageFiles((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...previews])
    e.target.value = ''
  }

  const removeNewImage = (index) => {
    const removedPreview = imagePreviews[index]
    if (removedPreview) URL.revokeObjectURL(removedPreview)
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const addSize = () => {
    const value = sizeInput.trim()
    if (!value) return
    const normalized = value.toUpperCase()
    setSizes((prev) =>
      prev.some((s) => s.toUpperCase() === normalized) ? prev : [...prev, normalized],
    )
    setSizeInput('')
  }

  const removeSize = (index) => {
    setSizes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      const created = await addCategory(name)
      const list = await fetchCategories()
      setCategories(list)
      setModalCategory(created.id)
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (err) {
      setError('Could not add category: ' + err.message)
    }
  }

  const handleRemoveCategory = async (cat) => {
    try {
      await removeCategory(cat.id)
      const list = await fetchCategories()
      setCategories(list)
      if (modalCategory === cat.id) setModalCategory(list[0]?.id || '')
    } catch (err) {
      setError(
        err.message === 'in-use'
          ? `Cannot remove "${cat.name}" — products still use this category.`
          : 'Could not remove category: ' + err.message,
      )
    }
  }

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await response.json()
    return data.secure_url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!productName || !price) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const totalImages = imageUrls.length + imageFiles.length
      if (!editingProduct && totalImages === 0) {
        setError('Please add at least one product image')
        setLoading(false)
        return
      }

      if (!modalCategory) {
        setError('Category is required')
        setLoading(false)
        return
      }

      const uploadedUrls = []
      if (imageFiles.length) {
        setUploadingImage(true)
        for (const file of imageFiles) {
          const url = await uploadToCloudinary(file)
          uploadedUrls.push(url)
        }
        setUploadingImage(false)
      }

      const finalImageUrls = [...imageUrls, ...uploadedUrls].filter(Boolean)

      if (finalImageUrls.length === 0) {
        setError('Please add at least one product image')
        setLoading(false)
        return
      }

      const productData = {
        name: productName,
        price: parseFloat(price),
        description: description || '',
        stock: parseInt(stock) || 0,
        classification: classification || '',
        category: modalCategory,
        sizes: sizes,
        imageUrl: finalImageUrls[0],
        imageUrls: finalImageUrls,
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        })
      }

      resetForm()
      onProductAdded()
      onClose()
    } catch (err) {
      setError('Error saving product: ' + err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProduct ? 'Edit Product' : `Add Product to ${categories.find((c) => c.id === modalCategory)?.name || 'Category'}`}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="productName">Product Name *</label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₱) *</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="stock">Stock Quantity</label>
              <input
                type="number"
                id="stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="cat-label-row">
              Category *
              <button
                type="button"
                className="cat-manage-link"
                onClick={() => setManageOpen((v) => !v)}
              >
                Manage
              </button>
            </label>

            {manageOpen && (
              <div className="cat-manage">
                {categories.length === 0 && (
                  <p className="cat-manage-empty">No categories yet.</p>
                )}
                {categories.map((c) => (
                  <div key={c.id} className="cat-manage-item">
                    <span>{c.name}</span>
                    <button
                      type="button"
                      className="cat-manage-remove"
                      onClick={() => handleRemoveCategory(c)}
                      aria-label={`Remove ${c.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <select
              id="category"
              value={modalCategory}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setAddingCategory(true)
                  return
                }
                setModalCategory(e.target.value)
              }}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__add_new__">+ Add new category…</option>
            </select>

            {addingCategory && (
              <div className="cat-add-row">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="New category name"
                  autoFocus
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddCategory}>
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setAddingCategory(false)
                    setNewCategoryName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="classification">Classification</label>
            <select
              id="classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            >
              <option value="">None</option>
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sizeInput">Available Sizes</label>
            <div className="size-input-row">
              <input
                type="text"
                id="sizeInput"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSize()
                  }
                }}
                placeholder="e.g. S, M, L or 9"
              />
              <button type="button" className="btn btn-secondary" onClick={addSize}>
                Add
              </button>
            </div>
            {sizes.length > 0 && (
              <div className="size-chips">
                {sizes.map((s, idx) => (
                  <span key={`${s}-${idx}`} className="size-chip">
                    {s}
                    <button
                      type="button"
                      className="size-chip-remove"
                      onClick={() => removeSize(idx)}
                      aria-label={`Remove size ${s}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Product Images {!editingProduct && '*'}</label>
            <div className="image-gallery">
              <label className="image-drop" title="Add photos" aria-label="Add photos">
                <ImagePlus size={30} strokeWidth={1.8} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden-file"
                />
              </label>

              {imageUrls.map((url, idx) => (
                <div key={`exist-${idx}`} className="image-thumb">
                  <img src={url} alt={`Product ${idx + 1}`} />
                  <button
                    type="button"
                    className="image-remove"
                    onClick={() => removeExistingImage(idx)}
                    aria-label="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                  {idx === 0 && <span className="image-primary">Primary</span>}
                </div>
              ))}
              {imagePreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="image-thumb">
                  <img src={url} alt={`New ${idx + 1}`} />
                  <button
                    type="button"
                    className="image-remove"
                    onClick={() => removeNewImage(idx)}
                    aria-label="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                  {imageUrls.length === 0 && idx === 0 && (
                    <span className="image-primary">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="btn btn-primary btn-full"
            >
              {loading
                ? 'Saving...'
                : uploadingImage
                  ? 'Uploading...'
                  : editingProduct
                    ? 'Update Product'
                    : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-full"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
