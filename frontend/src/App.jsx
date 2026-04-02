import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true')
  const [showRegister, setShowRegister] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [voiceBlob, setVoiceBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (user) {
      fetchHistory()
      loadChatHistory()
      
      const pingInterval = setInterval(() => {
        fetch(`${API_URL}/api/ping`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {})
      }, 30000)
      
      return () => clearInterval(pingInterval)
    }
  }, [user, token])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to fetch history')
    }
  }

  const loadChatHistory = () => {
    const saved = localStorage.getItem('chatHistory')
    if (saved) {
      setChatHistory(JSON.parse(saved))
    }
  }

  const saveChatToHistory = (msgs) => {
    if (msgs.length === 0) return
    const firstUserMsg = msgs.find(m => m.role === 'user')
    const title = firstUserMsg ? firstUserMsg.content.substring(0, 40) + '...' : 'New Chat'
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]')
    const newChat = {
      id: Date.now(),
      title,
      messages: msgs,
      timestamp: new Date().toISOString()
    }
    const updated = [newChat, ...history.filter(h => JSON.stringify(h.messages) !== JSON.stringify(msgs))]
    localStorage.setItem('chatHistory', JSON.stringify(updated.slice(0, 50)))
    setChatHistory(updated.slice(0, 50))
  }

  const loadChat = (chat) => {
    setMessages(chat.messages)
    setSidebarOpen(false)
  }

  const deleteChat = (chatId, e) => {
    e.stopPropagation()
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]')
    const updated = history.filter(h => h.id !== chatId)
    localStorage.setItem('chatHistory', JSON.stringify(updated))
    setChatHistory(updated)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password: password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setAuthError(data.detail || 'Registration failed')
        return
      }
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ id: data.user_id }))
      localStorage.setItem('userEmail', identifier)
      setToken(data.token)
      setUser({ id: data.user_id, email: identifier })
      setPassword('')
      setIdentifier('')
    } catch (err) {
      setAuthError('Connection error. Please try again.')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email: identifier })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setAuthError(data.detail || 'Login failed')
        return
      }
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ id: data.user_id }))
      localStorage.setItem('userEmail', identifier)
      localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false')
      setToken(data.token)
      setUser({ id: data.user_id, email: identifier })
      setIsAdmin(data.is_admin)
      setPassword('')
      fetchHistory()
    } catch (err) {
      setAuthError('Connection error. Please try again.')
    }
  }

  const startNewChat = async () => {
    if (messages.length > 0) {
      saveChatToHistory(messages)
    }
    try {
      await fetch(`${API_URL}/api/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Failed to clear history')
    }
    setMessages([])
  }

  const logout = () => {
    if (messages.length > 0) {
      saveChatToHistory(messages)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isAdmin')
    setToken(null)
    setUser(null)
    setIsAdmin(false)
    setMessages([])
    setShowUserMenu(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      })
      const data = await res.json()
      const finalMessages = [...newMessages, { role: 'assistant', content: data.answer }]
      setMessages(finalMessages)
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setVoiceBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        
        await sendVoiceToBackend(blob)
      }
      
      setMediaRecorder(recorder)
      recorder.start()
      setRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
      alert('Microphone access denied. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop()
      setRecording(false)
    }
  }

  const sendVoiceToBackend = async (blob) => {
    setLoading(true)
    
    const newMessages = [...messages]
    setMessages(newMessages)

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      
      const res = await fetch(`${API_URL}/api/voice-chat`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await res.json()
      
      if (data.error || !data.text) {
        setMessages([...messages, { role: 'assistant', content: 'Sorry, could not process voice. Please try again.' }])
        setLoading(false)
        return
      }
      
      const userContent = data.user_text || '🎤 Voice message'
      const finalMessages = [
        ...messages,
        { role: 'user', content: userContent },
        { role: 'assistant', content: data.text }
      ]
      setMessages(finalMessages)
    } catch (err) {
      console.error('Voice error:', err)
      setMessages([...messages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
    setLoading(false)
  }

  const savedEmail = localStorage.getItem('userEmail') || identifier
  
  const getInitials = (email) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }
  
  const suggestions = [
    'Help me write a Python function',
    'Explain quantum computing',
    'Write a creative story',
    'Debug my code'
  ]
  
  const handleSuggestion = (suggestion) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  if (!user) {
    return (
      <div className={`app ${theme}`}>
        <div className="login-page">
          <div className="login-box">
            <div className="login-logo">🤖</div>
            <h1>AI Assistant</h1>
            <p className="login-subtitle">
              {showRegister ? 'Create your account' : 'Welcome back'}
            </p>
            
            <form onSubmit={showRegister ? handleRegister : handleLogin} className="login-form">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
              />
              {authError && <p className="auth-error">{authError}</p>}
              <button type="submit" className="login-btn">
                {showRegister ? 'Sign Up' : 'Login'}
              </button>
            </form>
            
            <p className="login-switch">
              {showRegister ? 'Already have an account? ' : "Don't have an account? "}
              <span onClick={() => { setShowRegister(!showRegister); setAuthError(''); }}>
                {showRegister ? 'Login' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${theme}`}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button onClick={startNewChat} className="new-chat-btn">
            <span>➕</span>
            <span>New Chat</span>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Today</div>
            {chatHistory.filter(h => {
              const chatDate = new Date(h.timestamp)
              const today = new Date()
              return chatDate.toDateString() === today.toDateString()
            }).map(chat => (
              <div key={chat.id} className="nav-item" onClick={() => loadChat(chat)}>
                <span className="nav-item-icon">💬</span>
                <span className="nav-item-text">{chat.title}</span>
                <button className="nav-item-delete" onClick={(e) => deleteChat(chat.id, e)}>✕</button>
              </div>
            ))}
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Previous 7 Days</div>
            {chatHistory.filter(h => {
              const chatDate = new Date(h.timestamp)
              const today = new Date()
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              return chatDate > weekAgo && chatDate.toDateString() !== today.toDateString()
            }).map(chat => (
              <div key={chat.id} className="nav-item" onClick={() => loadChat(chat)}>
                <span className="nav-item-icon">💬</span>
                <span className="nav-item-text">{chat.title}</span>
                <button className="nav-item-delete" onClick={(e) => deleteChat(chat.id, e)}>✕</button>
              </div>
            ))}
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Older</div>
            {chatHistory.filter(h => {
              const chatDate = new Date(h.timestamp)
              const today = new Date()
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              return chatDate <= weekAgo
            }).map(chat => (
              <div key={chat.id} className="nav-item" onClick={() => loadChat(chat)}>
                <span className="nav-item-icon">💬</span>
                <span className="nav-item-text">{chat.title}</span>
                <button className="nav-item-delete" onClick={(e) => deleteChat(chat.id, e)}>✕</button>
              </div>
            ))}
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">{getInitials(savedEmail)}</div>
            <div className="user-details">
              <div className="user-email">{savedEmail}</div>
            </div>
            <button className="user-menu-btn">☰</button>
          </div>
          
          {showUserMenu && (
            <div className="user-menu">
              {isAdmin && (
                <Link to="/admin" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                  <span>⚙️</span> Admin Panel
                </Link>
              )}
              <button className="user-menu-item danger" onClick={logout}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
            <div className="header-logo">🤖</div>
            <h1>AI Assistant</h1>
          </div>
          <div className="header-right">
            {isAdmin && <Link to="/admin" className="admin-link">⚙️ <span>Admin</span></Link>}
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-container">🤖</div>
              <h2>How can I help you today?</h2>
              <p>I'm your AI assistant. Ask me anything - from coding help to creative writing!</p>
              <div className="empty-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="suggestion-btn" onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="footer">
          <form onSubmit={handleSubmit} className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? "Recording..." : "Type your message..."}
              disabled={loading || recording}
            />
            <button 
              type="button" 
              onClick={recording ? stopRecording : startRecording} 
              className={`icon-btn voice-btn ${recording ? 'recording' : ''}`}
              disabled={loading}
              title={recording ? 'Stop recording' : 'Start voice recording'}
            >
              {recording ? (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span className="recording-dot"></span>
                  <span className="recording-dot"></span>
                </div>
              ) : '🎤'}
            </button>
            <button type="submit" disabled={loading || !input.trim() || recording} className="icon-btn send-btn">
              ➤
            </button>
          </form>
          {recording && <p className="recording-text">Recording... Click to stop</p>}
          <p className="footer-text">AI may produce inaccurate information.</p>
        </footer>
      </main>
    </div>
  )
}

export default App
