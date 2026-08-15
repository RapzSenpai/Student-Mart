const ORDER_NUMBER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateOrderNumber() {
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += ORDER_NUMBER_CHARS[Math.floor(Math.random() * ORDER_NUMBER_CHARS.length)]
  }
  return `SM-${code}`
}

export function displayOrderRef(order) {
  if (order?.orderNumber) return order.orderNumber
  const id = order?.id || ''
  return `ORD-${(id.slice(0, 6) || '------').toUpperCase()}`
}
