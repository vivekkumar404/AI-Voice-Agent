import { useState, useEffect } from 'react'
import './Admin.css'

const API_URL = 'http://localhost:8000'

function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, verified: 0, unverified: 0 })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        setError('Please login as admin')
        return
      }

      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await res.json()
      setUsers(data.users)
      
      const verified = data.users.filter(u => u.is_verified).length
      const totalChats = data.users.reduce((sum, u) => sum + u.chat_count, 0)
      
      setStats({
        totalUsers: data.users.length,
        totalChats,
        verified,
        unverified: data.users.length - verified
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (err) {
      alert('Failed to delete user')
    }
  }

  const clearUserChats = async (userId) => {
    if (!confirm('Clear all chats for this user?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/api/admin/chats/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchUsers()
        alert('Chats cleared successfully')
      }
    } catch (err) {
      alert('Failed to clear chats')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Admin Panel</h1>
        <div className="admin-stats">
          <div className="stat">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.totalChats}</span>
            <span className="stat-label">Chats</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.verified}</span>
            <span className="stat-label">Verified</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.unverified}</span>
            <span className="stat-label">Unverified</span>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Chats</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span className={`badge ${user.is_verified ? 'verified' : 'unverified'}`}>
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                      {user.is_admin && <span className="badge admin">Admin</span>}
                    </td>
                    <td>{user.chat_count}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      {!user.is_admin && (
                        <div className="action-btns">
                          <button onClick={() => clearUserChats(user.id)} className="clear-btn">
                            Clear Chats
                          </button>
                          <button onClick={() => deleteUser(user.id)} className="delete-btn">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="no-results">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
