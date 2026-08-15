import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeNotifications,
  markAsRead,
  markAllAsRead,
  formatNotifTime,
} from '../services/notifications'
import { CheckCheck, ArrowRight } from 'lucide-react'
import '../css/NotificationBell.css'

export function NotificationBell() {
  const { user, userRole, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notifActive =
    location.pathname === '/notifications' || location.pathname === '/admin/notifications'
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const isAdmin = userRole === 'admin'
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (loading || !user) {
      setNotifications([])
      return
    }
    const unsubscribe = subscribeNotifications({
      recipientId: user.uid,
      recipientRole: isAdmin ? 'admin' : null,
      onUpdate: setNotifications,
    })
    return unsubscribe
  }, [user, userRole, isAdmin, loading])

  // Close dropdown on outside click.
  useEffect(() => {
    if (!notifOpen) return
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  const handleOpen = () => {
    setNotifOpen((o) => !o)
  }

  const handleMarkAllRead = () => {
    if (unreadCount > 0) markAllAsRead(notifications)
  }

  const handleViewAll = () => {
    setNotifOpen(false)
    navigate(isAdmin ? '/admin/notifications' : '/notifications')
  }

  const handleClick = (n) => {
    setNotifOpen(false)
    markAsRead(n.id)
    if (n.type === 'new_order' || n.recipientRole === 'admin') {
      navigate('/admin/orders')
    } else {
      navigate('/orders')
    }
  }

  return (
    <div className="notif-wrapper" ref={notifRef}>
      <button
        type="button"
        className={`nav-icon-btn ${notifActive ? 'active' : ''}`}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={notifOpen}
        onClick={handleOpen}
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && <span className="nav-dot" aria-hidden="true" />}
      </button>

      {notifOpen && (
        <div className="notif-dropdown" role="menu" aria-label="Notifications">
          <div className="notif-header">
            <span>Notifications</span>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={handleMarkAllRead}
                  aria-label="Mark all as read"
                >
                  <CheckCheck size={15} strokeWidth={1.8} />
                  Mark all read
                </button>
              )}
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </div>
          </div>

          <div className="notif-body">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={28} strokeWidth={1.5} />
                <p>You're all caught up</p>
                <span>No notifications yet</span>
              </div>
            ) : (
              <ul className="notif-list">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'unread'}`}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleClick(n)
                      }
                    }}
                  >
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-message">{n.message}</p>
                    {n.createdAt && (
                      <span className="notif-time">{formatNotifTime(n.createdAt)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <button type="button" className="notif-view-all" onClick={handleViewAll}>
              View all
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
