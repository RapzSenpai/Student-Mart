import React, { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, User, Store, ClipboardList, ShoppingCart, Bell, LogOut, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { StudentMartLogo } from './StudentMartLogo'
import { NotificationBell } from './NotificationBell'
import '../css/Header.css'

export function Header() {
  const { user, userRole, logout } = useAuth()
  const { getTotalItems } = useCart()
  const navigate = useNavigate()
  const cartCount = getTotalItems()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = userRole === 'admin'

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen, closeMenu])

  const handleLogout = async () => {
    closeMenu()
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
      navigate('/')
    }
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = (user?.displayName || user?.email || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" aria-label="StudentMart home">
            <StudentMartLogo useImage markSize={30} textClassName="text-xl" />
          </Link>
        </div>

          {!isAdmin && (
            <nav className="navbar-links" aria-label="Primary">
              <NavLink
                to="/store"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Store
              </NavLink>
              {user && userRole !== 'admin' && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Orders
                </NavLink>
              )}
              <NavLink
                to="/cart"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Cart
                {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
              </NavLink>
            </nav>
          )}

        <div className="navbar-icons">
          <NotificationBell />

          {user && !isAdmin && (
            <button
              type="button"
              className={`nav-icon-btn profile-btn ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              <User size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="navbar-actions">
          {!user && (
            <>
              <Link to="/login" className="nav-link nav-link-muted">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary navbar-cta">
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            className="navbar-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="navbar-backdrop"
            aria-hidden="true"
            onClick={closeMenu}
          />
          <aside
            className="navbar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="drawer-top">
              <span className="drawer-title">Menu</span>
              <button
                type="button"
                className="drawer-close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="drawer-user">
                <div className="drawer-avatar" aria-hidden="true">
                  {initials}
                </div>
                <div className="drawer-user-meta">
                  <span className="drawer-user-name">{displayName}</span>
                  {user.email && (
                    <span className="drawer-user-email">{user.email}</span>
                  )}
                </div>
              </div>
            )}

            <nav className="drawer-nav" aria-label="User menu">
              {isAdmin ? (
                <>
                  <NavLink
                    to="/admin/products"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <Package size={19} strokeWidth={1.8} />
                    <span>Products</span>
                  </NavLink>
                  <NavLink
                    to="/admin/orders"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <ClipboardList size={19} strokeWidth={1.8} />
                    <span>Orders</span>
                  </NavLink>
                  <NavLink
                    to="/admin/notifications"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <Bell size={19} strokeWidth={1.8} />
                    <span>Notifications</span>
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <User size={19} strokeWidth={1.8} />
                    <span>Users</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/store"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <Store size={19} strokeWidth={1.8} />
                    <span>Store</span>
                  </NavLink>
                  {user && (
                    <NavLink
                      to="/orders"
                      className={({ isActive }) =>
                        `drawer-item ${isActive ? 'active' : ''}`
                      }
                      onClick={closeMenu}
                    >
                      <ClipboardList size={19} strokeWidth={1.8} />
                      <span>Orders</span>
                    </NavLink>
                  )}
                  <NavLink
                    to="/cart"
                    className={({ isActive }) =>
                      `drawer-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    <ShoppingCart size={19} strokeWidth={1.8} />
                    <span>Cart</span>
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </NavLink>
                  {user && (
                    <NavLink
                      to="/notifications"
                      className={({ isActive }) =>
                        `drawer-item ${isActive ? 'active' : ''}`
                      }
                      onClick={closeMenu}
                    >
                      <Bell size={19} strokeWidth={1.8} />
                      <span>Notifications</span>
                    </NavLink>
                  )}
                  {user && (
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `drawer-item ${isActive ? 'active' : ''}`
                      }
                      onClick={closeMenu}
                    >
                      <User size={19} strokeWidth={1.8} />
                      <span>Profile</span>
                    </NavLink>
                  )}
                </>
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    className="drawer-item"
                    onClick={closeMenu}
                  >
                    <User size={19} strokeWidth={1.8} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="drawer-item"
                    onClick={closeMenu}
                  >
                    <Store size={19} strokeWidth={1.8} />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </nav>

            {user && (
              <div className="drawer-footer">
                <button
                  type="button"
                  className="drawer-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={19} strokeWidth={1.8} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </header>
  )
}
