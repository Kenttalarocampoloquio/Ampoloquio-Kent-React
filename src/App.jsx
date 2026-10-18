import { useEffect, useState } from 'react'
import api from './api'
import './App.css'

const emptyForm = { product_name: '', description: '', price: '', quantity: '' }

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')

  useEffect(() => { document.title = 'Kent\u2019s Product Manager' }, [])

  const msg = (e) => e.response?.data?.message || e.response?.data?.error || e.message

  const load = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data.data || [])
    } catch (e) {
      setError(msg(e))
      if (e.response?.status === 401) clearSession()
    }
  }

  useEffect(() => { if (token) load() }, [token])

  const clearSession = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')
    setToken(null)
    setProducts([])
  }

  const login = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/login', creds)
      const { access_token, refresh_token } = res.data.tokens
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      const name = res.data.user?.username || creds.username
      localStorage.setItem('username', name)
      setUsername(name)
      setToken(access_token)
    } catch (e) { setError(msg(e)) }
  }

  const logout = async () => {
    try {
      await api.post('/logout', { refresh_token: localStorage.getItem('refresh_token') })
    } catch { /* ignore */ }
    clearSession()
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) await api.put(`/products/${editId}`, form)
      else await api.post('/products', form)
      setForm(emptyForm)
      setEditId(null)
      load()
    } catch (e) { setError(msg(e)) }
  }

  const edit = (p) => {
    setEditId(p.id)
    setForm({ product_name: p.product_name, description: p.description, price: p.price, quantity: p.quantity })
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await api.delete(`/products/${id}`); load() }
    catch (e) { setError(msg(e)) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (!token) {
    return (
      <div className="login">
        <div className="panel login-card">
          <h1>Kent&rsquo;s Product Manager</h1>
          <p className="sub">Sign in to manage your products</p>
          <form onSubmit={login}>
            <label>Username
              <input value={creds.username} autoComplete="username"
                onChange={(e) => setCreds({ ...creds, username: e.target.value })} required />
            </label>
            <label>Password
              <input type="password" value={creds.password} autoComplete="current-password"
                onChange={(e) => setCreds({ ...creds, password: e.target.value })} required />
            </label>
            <button className="primary">Log In</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <>
      <nav className="topbar">
        <span className="brand"><i />Kent&rsquo;s Product Manager</span>
        <span className="who">Logged in as {username || 'user'}
          <button className="link" onClick={logout}>Logout</button>
        </span>
      </nav>

      <main className="page">
        <h2>Inventory</h2>
        {error && <p className="error">{error}</p>}

        <form className="panel row" onSubmit={save}>
          <input placeholder="Product name" value={form.product_name} onChange={set('product_name')} required />
          <input placeholder="Description" value={form.description} onChange={set('description')} />
          <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={set('price')} required />
          <input type="number" placeholder="Quantity" value={form.quantity} onChange={set('quantity')} required />
          <button className="primary">{editId ? 'Save Changes' : 'Add New Product'}</button>
          {editId && <button type="button" className="outline"
            onClick={() => { setEditId(null); setForm(emptyForm) }}>Cancel</button>}
        </form>

        <div className="panel table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th>Price</th><th>Quantity</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.product_name}</td>
                  <td>{p.description}</td>
                  <td>{Number(p.price).toFixed(2)}</td>
                  <td>{p.quantity}</td>
                  <td>{p.created_at}</td>
                  <td className="actions">
                    <button className="outline" onClick={() => edit(p)}>Edit</button>
                    <button className="outline danger" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!products.length && <tr><td colSpan="6" className="empty">No products yet. Add your first one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}