import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { notifyOrderStatusChange } from '../services/notifications'
import { Download, Search, TrendingUp, Package, ClipboardList, Clock, PackageCheck, CheckCircle2, ChevronDown } from 'lucide-react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import '../css/AdminOrdersDashboard.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_FLOW = {
  pending: { next: 'confirmed', label: 'Confirm' },
  confirmed: { next: 'ready_for_pickup', label: 'Mark Ready' },
  ready_for_pickup: { next: 'completed', label: 'Complete' },
}

const PAGE_SIZE = 12

function orderTime(order) {
  const d = order?.createdAt?.toDate?.()
  return d instanceof Date ? d.getTime() : 0
}

function buildGroups(orders) {
  const map = new Map()

  orders.forEach((order) => {
    const key = order.userId || order.userEmail || '__guest__'
    if (!map.has(key)) {
      map.set(key, {
        customerKey: key,
        email: order.userEmail || 'Guest / Unknown',
        orders: [],
        count: 0,
        totalSpent: 0,
        statusMix: {},
        latest: 0,
      })
    }
    const g = map.get(key)
    g.orders.push(order)
    g.count += 1
    g.totalSpent += Number(order.totalAmount) || 0
    g.statusMix[order.status] = (g.statusMix[order.status] || 0) + 1
    const t = orderTime(order)
    if (t > g.latest) g.latest = t
  })

  const groups = Array.from(map.values())
  groups.forEach((g) =>
    g.orders.sort((a, b) => orderTime(b) - orderTime(a)),
  )
  groups.sort((a, b) => b.latest - a.latest)
  return groups
}

export function AdminOrdersDashboard() {
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('month')
  const [activeView, setActiveView] = useState('orders')
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      navigate('/')
      return
    }

    fetchAllOrders()
  }, [user, userRole, navigate])

  useEffect(() => {
    setPage(0)
  }, [filterStatus, search])

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const ordersList = []

      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setAllOrders(ordersList)
      setError('')
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      })

      const updatedOrder = allOrders.find((o) => o.id === orderId)

      setAllOrders(
        allOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      if (updatedOrder) {
        try {
          await notifyOrderStatusChange({ ...updatedOrder, status: newStatus }, newStatus)
        } catch (notifErr) {
          console.error('Failed to send status notification:', notifErr)
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Failed to update order status. Please try again.')
    }
  }

  const esc = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const generateReceiptHTML = (order) => {
    const ref = order.id.toUpperCase()
    const date = formatDate(order.createdAt)
    const items = order.items || []
    const itemsRows = items
      .map((item) => {
        const qty = item.quantity || 1
        const unit = Number(item.price) || 0
        const subtotal = unit * qty
        const sizeText = item.size ? ` (Size ${item.size})` : ''
        return `
          <tr>
            <td>${esc(item.name || 'Unknown Product')}${esc(sizeText)}</td>
            <td class="num">${qty}</td>
            <td class="num">₱${unit.toFixed(2)}</td>
            <td class="num">₱${subtotal.toFixed(2)}</td>
          </tr>`
      })
      .join('')
    const total = Number(order.totalAmount) || 0

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudentMart Receipt — ${esc(ref)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; background: #f4f6f9; color: #1a2233; margin: 0; padding: 2rem 1rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    .brand { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.25rem; }
    .brand h1 { margin: 0; font-size: 1.5rem; color: #007bff; letter-spacing: -0.02em; }
    .brand p { margin: 0.25rem 0 0; font-size: 0.8rem; color: #64748b; }
    .meta { font-size: 0.85rem; margin-bottom: 1.25rem; }
    .meta div { display: flex; justify-content: space-between; padding: 0.2rem 0; }
    .meta .label { color: #64748b; }
    .section-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 1.25rem 0 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; color: #64748b; font-weight: 600; padding: 0.4rem 0; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.45rem 0; border-bottom: 1px solid #f1f5f9; }
    .num { text-align: right; }
    .total-row td { font-weight: 700; font-size: 1rem; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 0.75rem; }
    .pickup { background: #f0f7ff; border: 1px solid #cfe3ff; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; }
    .pickup .row { display: flex; justify-content: space-between; padding: 0.15rem 0; }
    .status { display: inline-block; margin-top: 1rem; padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; background: #eef2f7; color: #334155; }
    .footer { text-align: center; font-size: 0.75rem; color: #94a3b8; margin-top: 1.5rem; }
    @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="brand">
      <h1>StudentMart</h1>
      <p>Campus Pickup Store</p>
    </div>
    <div class="meta">
      <div><span class="label">Order Reference</span><span>#${esc(ref)}</span></div>
      <div><span class="label">Date &amp; Time</span><span>${esc(date)}</span></div>
      <div><span class="label">Customer</span><span>${esc(order.userEmail || 'N/A')}</span></div>
    </div>
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Subtotal</th></tr>
      </thead>
      <tbody>
        ${itemsRows || '<tr><td colspan="4">No items</td></tr>'}
        <tr class="total-row">
          <td colspan="3" class="num">Total</td>
          <td class="num">₱${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <div class="section-title">Pickup Information</div>
    <div class="pickup">
      <div class="row"><span>Location</span><span>${esc(order.pickupLocation || 'Accounting Office')}</span></div>
      <div class="row"><span>Payment</span><span>${esc(order.paymentMethod || 'Cash on Pickup')}</span></div>
      ${order.notes ? `<div class="row"><span>Notes</span><span>${esc(order.notes)}</span></div>` : ''}
    </div>
    <div class="status">${esc(order.status || 'pending')}</div>
    <div class="footer">Thank you for shopping at StudentMart<br/>Show this receipt when picking up your order.</div>
  </div>
</body>
</html>`
  }

  const handleDownloadReceipt = (order) => {
    const html = generateReceiptHTML(order)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `StudentMart-Receipt-${order.id.toUpperCase()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getOrdersByTimeframe = () => {
    const now = new Date()
    const grouped = {}

    allOrders.forEach((order) => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
      let key

      if (analyticsTimeframe === 'day') {
        const daysAgo = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        if (daysAgo <= 30) {
          key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      } else if (analyticsTimeframe === 'week') {
        const weeksAgo = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24 * 7))
        if (weeksAgo <= 12) {
          const weekStart = new Date(orderDate)
          weekStart.setDate(orderDate.getDate() - orderDate.getDay())
          key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      } else if (analyticsTimeframe === 'month') {
        const monthsAgo = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth())
        if (monthsAgo <= 12) {
          key = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        }
      } else if (analyticsTimeframe === 'year') {
        key = orderDate.getFullYear().toString()
      }

      if (key) {
        if (!grouped[key]) {
          grouped[key] = { total: 0, pending: 0, confirmed: 0, ready_for_pickup: 0, completed: 0, cancelled: 0 }
        }
        grouped[key].total++
        grouped[key][order.status] = (grouped[key][order.status] || 0) + 1
      }
    })

    return Object.entries(grouped).sort()
  }

  const analyticsData = getOrdersByTimeframe()

  const getProductStats = () => {
    const productMap = {}
    let totalProducts = 0

    allOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const productName = item.name || 'Unknown Product'
        if (!productMap[productName]) {
          productMap[productName] = 0
        }
        const quantity = item.quantity || 1
        productMap[productName] += quantity
        totalProducts += quantity
      })
    })

    return { productMap, totalProducts }
  }

  const { productMap, totalProducts } = getProductStats()

  const barChartData = {
    labels: analyticsData.map(([period]) => period),
    datasets: [
      {
        label: 'Total Orders',
        data: analyticsData.map(([, data]) => data.total),
        backgroundColor: '#007bff',
        borderColor: '#0056b3',
        borderWidth: 1,
      },
      {
        label: 'Completed',
        data: analyticsData.map(([, data]) => data.completed),
        backgroundColor: '#28a745',
        borderColor: '#218838',
        borderWidth: 1,
      },
      {
        label: 'Pending',
        data: analyticsData.map(([, data]) => data.pending),
        backgroundColor: '#ffc107',
        borderColor: '#ff9800',
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Orders Over Time (${analyticsTimeframe.charAt(0).toUpperCase() + analyticsTimeframe.slice(1)})`,
      },
    },
    scales: { y: { beginAtZero: true } },
  }

  const pieChartData = {
    labels: Object.keys(productMap),
    datasets: [
      {
        data: Object.values(productMap),
        backgroundColor: [
          '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
          '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed
            const percentage = ((value / totalProducts) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
      title: { display: true, text: 'Products Ordered Distribution' },
    },
  }

  const stats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
    ready_for_pickup: allOrders.filter((o) => o.status === 'ready_for_pickup').length,
    completed: allOrders.filter((o) => o.status === 'completed').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
  }

  const filteredOrders = (filterStatus === 'all' ? allOrders : allOrders.filter((o) => o.status === filterStatus))
    .filter((o) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        (o.userEmail || '').toLowerCase().includes(q)
      )
    })

  const groups = buildGroups(filteredOrders)
  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagedGroups = groups.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  )

  const FILTERS = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { key: 'ready_for_pickup', label: 'Ready', count: stats.ready_for_pickup },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ]

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <header className="aod-header">
          <div>
            <h1>Orders</h1>
            <p>Manage and review all customer orders</p>
          </div>
            <div className="aod-summary">
              <div className="aod-stat is-total">
                <span className="aod-stat-icon"><ClipboardList size={16} strokeWidth={2} /></span>
                <span className="aod-stat-text">
                  <span className="aod-stat-value">{stats.total}</span>
                  <span className="aod-stat-label">Total</span>
                </span>
              </div>
              <div className="aod-stat is-pending">
                <span className="aod-stat-icon"><Clock size={16} strokeWidth={2} /></span>
                <span className="aod-stat-text">
                  <span className="aod-stat-value">{stats.pending}</span>
                  <span className="aod-stat-label">Pending</span>
                </span>
              </div>
              <div className="aod-stat is-ready">
                <span className="aod-stat-icon"><PackageCheck size={16} strokeWidth={2} /></span>
                <span className="aod-stat-text">
                  <span className="aod-stat-value">{stats.ready_for_pickup}</span>
                  <span className="aod-stat-label">Ready</span>
                </span>
              </div>
              <div className="aod-stat is-completed">
                <span className="aod-stat-icon"><CheckCircle2 size={16} strokeWidth={2} /></span>
                <span className="aod-stat-text">
                  <span className="aod-stat-value">{stats.completed}</span>
                  <span className="aod-stat-label">Completed</span>
                </span>
              </div>
            </div>
        </header>

        <div className="aod-tabs">
          <button
            className={`aod-tab ${activeView === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveView('orders')}
          >
            <Package size={16} strokeWidth={1.8} />
            Orders
          </button>
          <button
            className={`aod-tab ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            <TrendingUp size={16} strokeWidth={1.8} />
            Analytics
          </button>
        </div>

        {activeView === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-controls">
              {['day', 'week', 'month', 'year'].map((tf) => (
                <button
                  key={tf}
                  className={`time-filter-btn ${analyticsTimeframe === tf ? 'active' : ''}`}
                  onClick={() => setAnalyticsTimeframe(tf)}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>

            <div className="charts-container">
              <div className="chart-wrapper bar-chart-wrapper">
                {analyticsData.length === 0 ? (
                  <div className="chart-empty"><p>No data available for this period</p></div>
                ) : (
                  <Bar data={barChartData} options={barChartOptions} />
                )}
              </div>
              <div className="chart-wrapper pie-chart-wrapper">
                {Object.keys(productMap).length === 0 ? (
                  <div className="chart-empty"><p>No products ordered yet</p></div>
                ) : (
                  <Pie data={pieChartData} options={pieChartOptions} />
                )}
              </div>
            </div>

            {Object.keys(productMap).length > 0 && (
              <div className="product-stats-summary">
                <h3>Product Order Summary</h3>
                <div className="product-stats-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity Ordered</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(productMap)
                        .sort(([, a], [, b]) => b - a)
                        .map(([productName, quantity]) => (
                          <tr key={productName}>
                            <td className="product-name">{productName}</td>
                            <td className="product-quantity">{quantity}</td>
                            <td className="product-percentage">
                              {((quantity / totalProducts) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'orders' && (
          <div className="aod-orders">
            <div className="aod-toolbar">
              <div className="aod-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`aod-filter ${filterStatus === f.key ? 'active' : ''}`}
                    onClick={() => setFilterStatus(f.key)}
                  >
                    {f.label}
                    <span className="aod-filter-count">{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="aod-search">
                <Search size={16} strokeWidth={1.8} />
                <input
                  type="text"
                  placeholder="Search by order # or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading && <div className="loading">Loading orders...</div>}
            {error && <div className="error-message">{error}</div>}

            {!loading && groups.length === 0 && (
              <div className="empty-state">
                <Package size={32} strokeWidth={1.5} />
                <p>No orders found</p>
              </div>
            )}

            {!loading && groups.length > 0 && (
              <div className="aod-groups-container">
                {pagedGroups.map((group) => {
                  const isGroupOpen = !!expandedGroups[group.customerKey]
                  return (
                    <div className="aod-group" key={group.customerKey}>
                      <button
                        type="button"
                        className="aod-group-head"
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [group.customerKey]: !prev[group.customerKey],
                          }))
                        }
                        aria-expanded={isGroupOpen}
                      >
                        <span className={`aod-group-caret ${isGroupOpen ? 'is-open' : ''}`}>
                          <ChevronDown size={16} strokeWidth={2} />
                        </span>
                        <span className="aod-group-email">{group.email}</span>
                        <span className="aod-group-meta">
                          <span className="aod-group-count">
                            {group.count} order{group.count !== 1 ? 's' : ''}
                          </span>
                          <span className="aod-group-spent">₱{group.totalSpent.toFixed(2)}</span>
                        </span>
                        <span className="aod-group-status">
                          {Object.entries(group.statusMix).map(([status, count]) => (
                            <span key={status} className={`order-status status-${status}`}>
                              {STATUS_LABELS[status] || status} {count}
                            </span>
                          ))}
                        </span>
                      </button>

                      {isGroupOpen && (
                        <div className="aod-group-orders-wrap">
                          <div className="aod-table">
                            <div className="aod-table-head">
                              <span>Order</span>
                              <span>Customer</span>
                              <span>Date</span>
                              <span className="aod-col-num">Items</span>
                              <span className="aod-col-num">Total</span>
                              <span>Status</span>
                              <span className="aod-col-actions">Actions</span>
                            </div>
                            <div className="aod-table-body">
                              {group.orders.map((order) => {
                                const isExpanded = expandedOrderId === order.id
                                const pickupLabel =
                                  order.pickupLocation === 'annex'
                                    ? 'Annex Building'
                                    : order.pickupLocation === 'main-campus'
                                      ? 'Main Campus'
                                      : order.pickupLocation || 'Accounting Office'
                                return (
                                  <React.Fragment key={order.id}>
                                    <button
                                      type="button"
                                      className={`aod-row ${isExpanded ? 'is-expanded' : ''}`}
                                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    >
                                      <span className="aod-order-ref">#{order.id.slice(0, 8).toUpperCase()}</span>
                                      <span className="aod-customer">{order.userEmail}</span>
                                      <span className="aod-date">{formatDate(order.createdAt)}</span>
                                      <span className="aod-col-num">{order.items?.length || 0}</span>
                                      <span className="aod-col-num aod-total">₱{order.totalAmount?.toFixed(2) || '0.00'}</span>
                                      <span>
                                        <span className={`order-status status-${order.status}`}>
                                          {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                      </span>
                                      <span
                                        className="aod-col-actions aod-actions"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {STATUS_FLOW[order.status] && (
                                          <button
                                            className="aod-act aod-act-primary"
                                            onClick={() => updateOrderStatus(order.id, STATUS_FLOW[order.status].next)}
                                          >
                                            {STATUS_FLOW[order.status].label}
                                          </button>
                                        )}
                                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                                          <button
                                            className="aod-act aod-act-danger"
                                            onClick={() => {
                                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                                updateOrderStatus(order.id, 'cancelled')
                                              }
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        )}
                                        <button
                                          className="aod-act aod-act-ghost"
                                          onClick={() => handleDownloadReceipt(order)}
                                          aria-label="Download receipt"
                                        >
                                          <Download size={15} strokeWidth={1.8} />
                                        </button>
                                      </span>
                                    </button>

                                    {isExpanded && (
                                      <div className="aod-row-detail">
                                        <div className="aod-detail-grid">
                                          <div className="aod-detail-block">
                                            <span className="aod-detail-label">Notes</span>
                                            <p className="aod-detail-value">
                                              {order.notes?.trim() ? order.notes : '—'}
                                            </p>
                                          </div>
                                          <div className="aod-detail-block">
                                            <span className="aod-detail-label">Pickup Location</span>
                                            <p className="aod-detail-value">{pickupLabel}</p>
                                          </div>
                                          <div className="aod-detail-block">
                                            <span className="aod-detail-label">Payment</span>
                                            <p className="aod-detail-value">
                                              {order.paymentMethod || 'Cash on Pickup'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="aod-detail-items">
                                          <span className="aod-detail-label">Items</span>
                                          <ul className="aod-detail-item-list">
                                            {(order.items || []).map((item, idx) => (
                                              <li key={`${order.id}-${item.productId || idx}`} className="aod-detail-item">
                                                <span className="aod-detail-item-name">
                                                  {item.name}
                                                  {item.size ? <span className="aod-detail-item-size"> · Size {item.size}</span> : null}
                                                </span>
                                                <span className="aod-detail-item-meta">
                                                  ₱{Number(item.price).toFixed(2)} × {item.quantity}
                                                </span>
                                                <span className="aod-detail-item-sub">
                                                  ₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </React.Fragment>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {totalPages > 1 && (
                  <div className="aod-pagination">
                    <button
                      type="button"
                      className="aod-page-btn"
                      disabled={safePage === 0}
                      onClick={() => setPage(safePage - 1)}
                    >
                      Prev
                    </button>
                    <span className="aod-page-info">
                      Page {safePage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="aod-page-btn"
                      disabled={safePage >= totalPages - 1}
                      onClick={() => setPage(safePage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
