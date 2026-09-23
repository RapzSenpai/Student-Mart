import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { STORE_SYSTEM_PROMPT } from '../config/storePrompt'
import { db, auth } from './firebase'

const GROQ_MODEL = 'openai/gpt-oss-120b'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ─── Check if the logged-in user is an admin ───────────────────────────────
async function getUserRole(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (!userDoc.exists()) return 'user'
  return userDoc.data().role || 'user'
}

// ─── Fetch all products ────────────────────────────────────────────────────
async function fetchProducts() {
  const snapshot = await getDocs(collection(db, 'products'))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ─── Fetch only this user's orders ────────────────────────────────────────
async function fetchUserOrders(uid) {
  const q = query(collection(db, 'orders'), where('userId', '==', uid))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ─── Fetch ALL orders and build analytics (admin only) ────────────────────
async function fetchAdminAnalytics() {
  const snapshot = await getDocs(collection(db, 'orders'))
  const allOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  const statusCounts = {}
  allOrders.forEach((order) => {
    const status = order.status || 'unknown'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  const productSales = {}
  allOrders.forEach((order) => {
    const countableStatuses = ['completed', 'delivered', 'paid']
    const isSale = countableStatuses.includes((order.status || '').toLowerCase())
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const name = item.name || item.productName || 'Unknown Product'
        if (!productSales[name]) {
          productSales[name] = { totalQuantity: 0, totalRevenue: 0, allOrderCount: 0 }
        }
        productSales[name].allOrderCount += 1
        if (isSale) {
          productSales[name].totalQuantity += item.quantity || 1
          productSales[name].totalRevenue += (item.price || 0) * (item.quantity || 1)
        }
      })
    }
  })

  const sortedSales = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)

  return {
    totalOrders: allOrders.length,
    ordersByStatus: statusCounts,
    mostSoldProducts: sortedSales.slice(0, 5),
    leastSoldProducts: [...sortedSales].reverse().slice(0, 5),
    allProductSales: sortedSales,
    totalRevenue: allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  }
}

// ─── Call Groq (OpenAI-compatible chat completions) ────────────────────────
async function callGroq(userContent) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key is not configured (set VITE_GROQ_API_KEY in .env).')
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: STORE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}). ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  return text || 'Sorry, I could not generate a response right now.'
}

// ─── Main function called by ChatWidget ───────────────────────────────────
export async function askStoreAssistant(userMessage) {
  const user = auth.currentUser

  if (!user) {
    const products = await fetchProducts()
    const fullMessage = `
User question: ${userMessage}

--- LIVE DATA ---
PRODUCTS:
${JSON.stringify(products, null, 2)}

Note: This user is not logged in so order information is unavailable.
    `.trim()

    return callGroq(fullMessage)
  }

  const role = await getUserRole(user.uid)
  const isAdmin = role === 'admin'

  if (isAdmin) {
    const [products, analytics] = await Promise.all([
      fetchProducts(),
      fetchAdminAnalytics(),
    ])

    const fullMessage = `
User question: ${userMessage}

--- LIVE ADMIN DATA (confidential) ---

PRODUCTS (with stock levels):
${JSON.stringify(products, null, 2)}

ORDER ANALYTICS:
- Total orders: ${analytics.totalOrders}
- Total revenue: ${analytics.totalRevenue}
- Orders by status: ${JSON.stringify(analytics.ordersByStatus)}

MOST SOLD PRODUCTS:
${JSON.stringify(analytics.mostSoldProducts, null, 2)}

LEAST SOLD PRODUCTS:
${JSON.stringify(analytics.leastSoldProducts, null, 2)}

FULL PRODUCT SALES BREAKDOWN:
${JSON.stringify(analytics.allProductSales, null, 2)}
    `.trim()

    return callGroq(fullMessage)
  }

  const [products, userOrders] = await Promise.all([
    fetchProducts(),
    fetchUserOrders(user.uid),
  ])

  const fullMessage = `
User question: ${userMessage}

--- LIVE DATA ---

PRODUCTS:
${JSON.stringify(products, null, 2)}

THIS USER'S ORDERS:
${userOrders.length ? JSON.stringify(userOrders, null, 2) : 'No orders yet.'}
  `.trim()

  return callGroq(fullMessage)
}
