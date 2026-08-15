import React, { createContext, useState, useContext, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

const STORAGE_PREFIX = 'studentmart_cart'

const keyFor = (uid) => `${STORAGE_PREFIX}_${uid || 'guest'}`

const loadCart = (key) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveCart = (key, cart) => {
  try {
    localStorage.setItem(key, JSON.stringify(cart))
  } catch {
    // ignore quota / serialization errors
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid

  // The active storage key follows the logged-in user; guests use a shared key.
  const keyRef = useRef(keyFor(uid))
  const [cart, setCart] = useState(() => loadCart(keyRef.current))

  // When the logged-in user changes, flush the current cart to its own key,
  // then load the next user's saved cart. Logging out switches to the guest
  // key (empty), so the header count disappears — but a user's cart is
  // restored when they log back in.
  useEffect(() => {
    const newKey = keyFor(uid)
    if (newKey !== keyRef.current) {
      saveCart(keyRef.current, cart)
      keyRef.current = newKey
      setCart(loadCart(newKey))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // Persist the active cart to its key whenever it changes.
  useEffect(() => {
    saveCart(keyRef.current, cart)
  }, [cart])

  const addToCart = (product, quantity = 1, size = '') => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === product.id && (item.size || '') === size,
      )
      const existingQty = existingItem ? existingItem.quantity : 0
      let newQty = existingQty + quantity
      if (product.stock !== undefined && product.stock !== null) {
        newQty = Math.min(newQty, product.stock)
      }
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id && (item.size || '') === size
            ? { ...item, quantity: newQty }
            : item,
        )
      } else {
        return [...prevCart, { ...product, quantity: newQty, size }]
      }
    })
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.id !== productId) return item
          let qty = quantity
          if (item.stock !== undefined && item.stock !== null) {
            qty = Math.min(qty, item.stock)
          }
          return { ...item, quantity: qty }
        }),
      )
    }
  }

  const updateItemPrice = (productId, newPrice) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === productId ? { ...item, price: newPrice } : item)),
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemPrice,
    clearCart,
    getTotalPrice,
    getTotalItems,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
