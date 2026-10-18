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
        <aside className="login-hero">
          <h2>Know what is on your shelf.</h2>
          <p>Add, edit and track every product in one place.</p>
        </aside>
        <div className="card">
          <h1>Welcome back</h1>
          <form onSubmit={login}>
            <input placeholder="Username" value={creds.username}
              onChange={(e) => setCreds({ ...creds, username: e.target.value })} required />
            <input type="password" placeholder="Password" value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })} required />
            <button>Log in</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    )
  }

  const stock = (q) => (Number(q) === 0 ? 'out' : Number(q) <= 5 ? 'low' : 'ok')

  return (
    <div className="page">
      <div className="card">
        <header>
          <h1>Products<span className="count">{products.length}</span></h1>
          <button className="ghost" onClick={logout}>Log out</button>
        </header>
        {error && <p className="error">{error}</p>}

        <form className="row" onSubmit={save}>
          <input placeholder="Product name" value={form.product_name} onChange={set('product_name')} required />
          <input placeholder="Description" value={form.description} onChange={set('description')} />
          <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={set('price')} required />
          <input type="number" placeholder="Qty" value={form.quantity} onChange={set('quantity')} required />
          <button>{editId ? 'Save changes' : 'Add product'}</button>
          {editId && <button type="button" className="ghost"
            onClick={() => { setEditId(null); setForm(emptyForm) }}>Cancel</button>}
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th>Price</th><th>In stock</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.product_name}</td>
                  <td>{p.description}</td>
                  <td>₱{p.price}</td>
                  <td><span className={`pill ${stock(p.quantity)}`}>{p.quantity}</span></td>
                  <td className="actions">
                    <button onClick={() => edit(p)}>Edit</button>
                    <button className="danger" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!products.length && <tr><td colSpan="5" className="empty">No products yet. Add your first one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}