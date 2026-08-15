import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Trash2, Bell, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  formatNotifTime,
} from '../services/notifications'
import '../css/NotificationsPage.css'

export function NotificationsPage() {
  const { user, userRole, loading } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  const isAdmin = userRole === 'admin'
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (loading || !user) {
      setNotifications([])
      setLoadingNotifs(false)
      return
    }
    setLoadingNotifs(true)
    const unsubscribe = subscribeNotifications({
      recipientId: user.uid,
      recipientRole: isAdmin ? 'admin' : null,
      onUpdate: (list) => {
        setNotifications(list)
        setLoadingNotifs(false)
      },
    })
    return unsubscribe
  }, [user, userRole, isAdmin, loading])

  const handleMarkAllRead = () => {
    if (unreadCount > 0) markAllAsRead(notifications)
  }

  const handleDeleteAll = () => {
    if (notifications.length === 0) return
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      deleteAllNotifications(notifications)
    }
  }

  const handleItemClick = (n) => {
    markAsRead(n.id)
    if (n.type === 'new_order' || n.recipientRole === 'admin') {
      navigate('/admin/orders')
    } else {
      navigate('/orders')
    }
  }

  const handleItemDelete = (e, id) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  return (
    <div className="notif-page">
      <div className="notif-page-container">
        <header className="notif-page-head">
          <div>
            <h1>
              <Bell size={24} strokeWidth={1.8} />
              Notifications
            </h1>
            <p className="notif-page-sub">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'You are all caught up'}
            </p>
          </div>
          <div className="notif-page-actions">
            <button
              type="button"
              className="notif-page-btn notif-page-btn-primary"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={16} strokeWidth={1.8} />
              Mark all as read
            </button>
            <button
              type="button"
              className="notif-page-btn notif-page-btn-danger"
              onClick={handleDeleteAll}
              disabled={notifications.length === 0}
            >
              <Trash2 size={16} strokeWidth={1.8} />
              Delete all
            </button>
          </div>
        </header>

        <div className="notif-page-body">
          {loadingNotifs ? (
            <div className="notif-page-loading">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="notif-page-empty">
              <Bell size={36} strokeWidth={1.5} />
              <p>You're all caught up</p>
              <span>No notifications yet</span>
            </div>
          ) : (
            <ul className="notif-page-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notif-page-item ${n.read ? '' : 'unread'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleItemClick(n)
                    }
                  }}
                >
                  <div className="notif-page-item-main">
                    <p className="notif-page-title">{n.title}</p>
                    <p className="notif-page-message">{n.message}</p>
                    {n.createdAt && (
                      <span className="notif-page-time">{formatNotifTime(n.createdAt)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="notif-page-delete"
                    aria-label="Delete notification"
                    onClick={(e) => handleItemDelete(e, n.id)}
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                  <ArrowRight size={16} strokeWidth={1.8} className="notif-page-arrow" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
