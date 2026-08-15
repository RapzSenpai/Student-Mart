import { db } from './firebase'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore'

export const NOTIFICATIONS_COLLECTION = 'notifications'

const STATUS_LABELS = {
  pending: 'pending',
  confirmed: 'confirmed',
  ready_for_pickup: 'ready for pickup',
  completed: 'completed',
  cancelled: 'cancelled',
}

// Subscribe to notifications for the current viewer.
// Admins receive role-scoped notifications; students receive user-scoped ones.
// orderBy is done client-side to avoid requiring a composite Firestore index.
export function subscribeNotifications({ recipientId, recipientRole, onUpdate }) {
  const col = collection(db, NOTIFICATIONS_COLLECTION)
  const q = recipientRole
    ? query(col, where('recipientRole', '==', recipientRole))
    : query(col, where('recipientId', '==', recipientId))

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      onUpdate(list)
    },
    (err) => console.error('Notification subscription error:', err),
  )
}

async function createNotification(data) {
  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    read: false,
    createdAt: serverTimestamp(),
    ...data,
  })
}

// Fired when a student places a new order — notifies all admins.
export async function notifyNewOrder(order) {
  const ref = (order.id || '').slice(0, 8).toUpperCase()
  await createNotification({
    recipientRole: 'admin',
    type: 'new_order',
    orderId: order.id,
    orderRef: ref,
    title: 'New Order Placed',
    message: `Order #${ref} from ${order.userEmail || 'a student'} is awaiting confirmation.`,
    status: order.status || 'pending',
  })
}

// Fired when an admin changes an order status — notifies the owning student.
export async function notifyOrderStatusChange(order, newStatus) {
  if (!order?.userId) return
  const ref = (order.id || '').slice(0, 8).toUpperCase()
  const label = STATUS_LABELS[newStatus] || newStatus
  await createNotification({
    recipientId: order.userId,
    type: 'order_status_update',
    orderId: order.id,
    orderRef: ref,
    title: 'Order Status Updated',
    message: `Your order #${ref} is now ${label}.`,
    status: newStatus,
  })
}

export async function markAsRead(notificationId) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { read: true })
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
  }
}

export async function markAllAsRead(notifications) {
  const unread = notifications.filter((n) => !n.read)
  if (unread.length === 0) return
  try {
    const batch = writeBatch(db)
    unread.forEach((n) => batch.update(doc(db, NOTIFICATIONS_COLLECTION, n.id), { read: true }))
    await batch.commit()
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err)
  }
}

export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId))
  } catch (err) {
    console.error('Failed to delete notification:', err)
  }
}

export async function deleteAllNotifications(notifications) {
  if (!notifications || notifications.length === 0) return
  try {
    const batch = writeBatch(db)
    notifications.forEach((n) =>
      batch.delete(doc(db, NOTIFICATIONS_COLLECTION, n.id)),
    )
    await batch.commit()
  } catch (err) {
    console.error('Failed to delete all notifications:', err)
  }
}

export function formatNotifTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
