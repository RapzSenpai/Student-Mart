import { db } from '../services/firebase'
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

export const DEFAULT_CATEGORIES = [
  { id: 'accessories', name: 'Accessories' },
  { id: 'handbook', name: 'Handbook' },
  { id: 'uniform', name: 'Uniform' },
  { id: 'writing', name: 'Writing' },
]

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

export async function fetchCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'))
    if (snapshot.empty) {
      const batch = writeBatch(db)
      DEFAULT_CATEGORIES.forEach((c) => {
        const ref = doc(collection(db, 'categories'))
        batch.set(ref, { name: c.name, createdAt: serverTimestamp() })
      })
      await batch.commit()
      return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
    }
    return snapshot.docs
      .map((d) => ({ id: d.id, name: d.data().name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error('Failed to load categories, using defaults:', err)
    return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
  }
}

export async function addCategory(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Category name is required')

  const existing = await fetchCategories()
  let base = slugify(trimmed) || 'category'
  let id = base
  let n = 2
  const taken = new Set(existing.map((c) => c.id))
  while (taken.has(id)) {
    id = `${base}-${n++}`
  }

  const ref = await addDoc(collection(db, 'categories'), {
    name: trimmed,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, name: trimmed }
}

export async function categoryHasProducts(id) {
  const snapshot = await getDocs(
    query(collection(db, 'products'), where('category', '==', id)),
  )
  return snapshot.size > 0
}

export async function removeCategory(id) {
  if (await categoryHasProducts(id)) {
    throw new Error('in-use')
  }
  await deleteDoc(doc(db, 'categories', id))
}
