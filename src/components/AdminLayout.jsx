import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package, ClipboardList, Users, LogOut, ShieldCheck, Bell } from 'lucide-react'
import '../css/AdminLayout.css'

export function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-tag">
            <ShieldCheck size={14} strokeWidth={2.2} />
            Admin
          </span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin">
          <NavLink
            to="/admin/products"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Package size={18} strokeWidth={1.8} />
            <span>Products</span>
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={18} strokeWidth={1.8} />
            <span>Orders</span>
          </NavLink>
          <NavLink
            to="/admin/notifications"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} strokeWidth={1.8} />
            <span>Notifications</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={18} strokeWidth={1.8} />
            <span>Users</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-nav-item as-button" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={1.8} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
