import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Admin.css'

const API_URL = 'http://localhost:8000'

function AdminApp() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, onlineUsers: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoggedIn(true)
      fetchUsers()
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers()
      const interval = setInterval(fetchUsers, 5000)
      
      const handleVisibility = () => {
        if (!document.hidden) {
          fetchUsers()
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)
      
      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }
  }, [isLoggedIn])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setLoginError(data.detail || 'Login failed')
        return
      }
      
      localStorage.setItem('adminToken', data.token)
      setIsLoggedIn(true)
      setAdminPassword('')
      fetchUsers()
    } catch (err) {
      setLoginError('Connection error')
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) return

      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await res.json()
      setUsers(data.users)
      
      const now = new Date()
      const onlineUsers = data.users.filter(u => {
        if (!u.last_seen) return false
        const lastSeen = new Date(u.last_seen)
        const diff = (now - lastSeen) / 1000
        return diff < 60
      }).length
      
      const totalChats = data.users.reduce((sum, u) => sum + u.chat_count, 0)
      setStats({
        totalUsers: data.users.length,
        totalChats,
        onlineUsers
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) fetchUsers()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const clearUserChats = async (userId) => {
    if (!confirm('Clear all chats?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/api/admin/chats/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchUsers()
        alert('Chats cleared')
      }
    } catch (err) {
      alert('Failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setIsLoggedIn(false)
    setUsers([])
  }

  const goToChat = () => {
    navigate('/')
  }

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false
    const now = new Date()
    const last = new Date(lastSeen)
    const diff = (now - last) / 1000
    return diff < 60
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diff = (now - date) / 1000
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return formatDate(dateString)
  }

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <div className="admin-login-logo">⚙️</div>
          <h1>Admin Login</h1>
          <p>Sign in to access the dashboard</p>
          <form onSubmit={handleAdminLogin}>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin Email"
              required
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit">Sign In</button>
          </form>
          <button onClick={goToChat} className="back-link">← Back to Chat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-logo">
            <div className="admin-logo-icon">⚙️</div>
            <h1>Admin Panel</h1>
          </Link>
        </div>
        
        <nav className="admin-nav">
          <div className="nav-section">
            <div className="nav-section-title">Dashboard</div>
            <div className="nav-item active">
              <span className="nav-item-icon">👥</span>
              <span>Users</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">💬</span>
              <span>Chats</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">📊</span>
              <span>Analytics</span>
            </div>
          </div>
        </nav>
        
        <div className="admin-sidebar-footer">
          <div className="admin-user-info" onClick={logout}>
            <div className="admin-user-avatar">AD</div>
            <div className="admin-user-details">
              <div className="admin-user-name">Admin</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-back-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1>Dashboard</h1>
          </div>
          
          <div className="admin-header-right">
            <div className="admin-stats-header">
              <div className="header-stat">
                <span className="header-stat-icon">👥</span>
                <span className="header-stat-value">{stats.totalUsers}</span>
                <span className="header-stat-label">Users</span>
              </div>
              <div className={`header-stat ${stats.onlineUsers > 0 ? 'online' : ''}`}>
                <span className="header-stat-icon">{stats.onlineUsers > 0 ? '●' : '○'}</span>
                <span className="header-stat-value">{stats.onlineUsers}</span>
                <span className="header-stat-label">Online</span>
              </div>
              <div className="header-stat">
                <span className="header-stat-icon">💬</span>
                <span className="header-stat-value">{stats.totalChats}</span>
                <span className="header-stat-label">Chats</span>
              </div>
            </div>
            
            <button onClick={goToChat} className="admin-back-btn">
              ← <span>Chat</span>
            </button>
            <button onClick={logout} className="admin-logout-btn">
              🚪 <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="stat-card users">
              <div className="stat-card-header">
                <div className="stat-card-icon">👥</div>
              </div>
              <div className="stat-card-value">{stats.totalUsers}</div>
              <div className="stat-card-label">Total Users</div>
            </div>
            
            <div className="stat-card online">
              <div className="stat-card-header">
                <div className="stat-card-icon">🟢</div>
              </div>
              <div className="stat-card-value">{stats.onlineUsers}</div>
              <div className="stat-card-label">Online Now</div>
            </div>
            
            <div className="stat-card chats">
              <div className="stat-card-header">
                <div className="stat-card-icon">💬</div>
              </div>
              <div className="stat-card-value">{stats.totalChats}</div>
              <div className="stat-card-label">Total Chats</div>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users by email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="users-card">
              <div className="users-card-header">
                <h2>All Users</h2>
                <span className="users-count">{filteredUsers.length} users</span>
              </div>
              
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Chats</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <span className={`status-indicator ${isUserOnline(user.last_seen) ? 'online' : 'offline'}`}>
                          <span className="status-dot"></span>
                        </span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">{getInitials(user.email)}</div>
                          <div className="user-email-cell">
                            <span className="user-id-text">ID: {user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || '-'}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="badge admin">Admin</span>
                        ) : (
                          <span className="badge user">User</span>
                        )}
                      </td>
                      <td>{user.chat_count}</td>
                      <td>{formatLastSeen(user.last_seen)}</td>
                      <td>
                        {!user.is_admin && (
                          <div className="action-btns">
                            <button onClick={() => clearUserChats(user.id)} className="action-btn clear">
                              Clear
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="action-btn delete">
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
      </main>
    </div>
  )
}

export default AdminApp
