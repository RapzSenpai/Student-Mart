import React, { useState, useEffect, useCallback } from 'react'
import { db } from '../services/firebase'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Search, ShieldCheck, GraduationCap, Trash2 } from 'lucide-react'
import '../css/AdminUsersPage.css'

const ROLE_FILTERS = [
  { id: 'all', name: 'All' },
  { id: 'student', name: 'Students' },
  { id: 'admin', name: 'Admins' },
]

function formatDate(value) {
  if (!value) return '—'
  const date = value?.toDate ? value.toDate() : new Date(value)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function initials(name, email) {
  const base = (name || email || '?').trim()
  return base.charAt(0).toUpperCase()
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }))
      setUsers(list)
      setError('')
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (uid, nextRole) => {
    if (!window.confirm(`Change this user's role to "${nextRole}"?`)) return
    try {
      setUpdatingId(uid)
      await updateDoc(doc(db, 'users', uid), { role: nextRole })
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: nextRole } : u))
      )
    } catch (err) {
      console.error('Error updating role:', err)
      window.alert('Failed to update role.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (u) => {
    if (
      !window.confirm(
        `Remove "${u.displayName || u.email}"? This deletes their user record. Their Firebase login may persist until removed from the Firebase console.`
      )
    )
      return
    try {
      await deleteDoc(doc(db, 'users', u.uid))
      setUsers((prev) => prev.filter((x) => x.uid !== u.uid))
    } catch (err) {
      console.error('Error deleting user:', err)
      window.alert('Failed to remove user.')
    }
  }

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.studentId || '').toLowerCase().includes(term)
    return matchesRole && matchesSearch
  })

  return (
    <div className="aus-wrap">
      <div className="aus-head">
        <div>
          <h1 className="aus-title">User Management</h1>
          <p className="aus-sub">{users.length} registered users</p>
        </div>
      </div>

      <div className="aus-toolbar">
        <div className="aus-search">
          <Search size={16} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search name, email, or student ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="aus-filters">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`aus-pill ${roleFilter === f.id ? 'active' : ''}`}
              onClick={() => setRoleFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="aus-table-wrap">
        {loading ? (
          <div className="aus-loading">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="aus-empty">No users found.</div>
        ) : (
          <table className="aus-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Student ID</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div className="aus-user">
                      <span className="aus-avatar">{initials(u.displayName, u.email)}</span>
                      <div className="aus-user-meta">
                        <span className="aus-name">{u.displayName || '—'}</span>
                        <span className="aus-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="aus-mono">{u.studentId || '—'}</td>
                  <td>
                    <span className={`aus-role ${u.role === 'admin' ? 'admin' : 'student'}`}>
                      {u.role === 'admin' ? (
                        <ShieldCheck size={14} strokeWidth={2} />
                      ) : (
                        <GraduationCap size={14} strokeWidth={2} />
                      )}
                      {u.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                    <select
                      className="aus-role-select"
                      value={u.role || 'student'}
                      disabled={updatingId === u.uid}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      title="Change role"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="aus-muted">{formatDate(u.createdAt)}</td>
                  <td className="aus-actions-cell">
                    <button
                      type="button"
                      className="aus-del"
                      onClick={() => handleDelete(u)}
                      title="Remove user"
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
