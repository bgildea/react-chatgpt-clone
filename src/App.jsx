import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/completions'
let nextChatId = 1

// Each chat keeps its own message list, so the whole conversation goes to the model.
const App = ({ fetchImpl = fetch }) => {
  const [chats, setChats] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentChat = chats.find(chat => chat.id === currentId)

  const createNewChat = () => {
    setCurrentId(null)
    setValue('')
    setError(null)
  }

  const sendMessage = async () => {
    const text = value.trim()
    if (!text || loading) return

    const id = currentId ?? nextChatId++
    const history = [...(currentChat?.messages ?? []), { role: 'user', content: text }]
    const title = currentChat?.title ?? text.slice(0, 80)

    setChats(prev => [...prev.filter(chat => chat.id !== id), { id, title, messages: history }])
    setCurrentId(id)
    setValue('')
    setError(null)
    setLoading(true)

    try {
      const response = await fetchImpl(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong.')
      setChats(prev => prev.map(chat =>
        chat.id === id ? { ...chat, messages: [...chat.messages, data.message] } : chat
      ))
    } catch (err) {
      setError(err.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="app">
      <section className="side-bar">
        <button onClick={createNewChat}>+ New chat</button>
        <ul className="history" aria-label="Previous chats">
          {chats.map(chat => (
            <li key={chat.id} onClick={() => { setCurrentId(chat.id); setError(null) }}>{chat.title}</li>
          ))}
        </ul>
        <nav>
          <p>Made by Brickisred</p>
        </nav>
      </section>
      <section className="main">
        {!currentChat && <h1>React Chat</h1>}
        <ul className="feed" aria-label="Conversation">
          {currentChat?.messages.map((chatMessage, index) => (
            <li key={index}>
              <p className="role">{chatMessage.role}</p>
              <p>{chatMessage.content}</p>
            </li>
          ))}
          {loading && <li className="pending"><p className="role">assistant</p><p>Thinking…</p></li>}
        </ul>
        <div className="bottom-section">
          {error && <p className="error" role="alert">{error}</p>}
          <div className="input-container">
            <input
              aria-label="Message"
              placeholder="Send a message"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button id="submit" aria-label="Send" onClick={sendMessage} disabled={loading}>➢</button>
          </div>
          <p className="info">
            A learning project. Model replies can be wrong, so check anything important.
          </p>
        </div>
      </section>
    </div>
  )
}

export default App
