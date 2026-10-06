import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API = 'https://ampoloquio-kent.onrender.com/api'
const emptyForm = { product_name: '', description: '', price: '', quantity: '' }

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const auth = { headers: { Authorization: `Bearer ${token}` } }
  const msg = (e) => e.response?.data?.message || e.response?.data?.error || e.message

  const load = async () => {
    try {
      const res = await axios.get(`${API}/products`, auth)
      setProducts(res.data.data || [])
    } catch (e) {
      setError(msg(e))
      if (e.response?.status === 401) logoutLocal()
    }
  }

  useEffect(() => { if (token) load() }, [token])

  const logoutLocal = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setProducts([])
  }

  const login = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post(`${API}/login`, creds)
      const t = res.data.tokens.access_token
      localStorage.setItem('access_token', t)
      setToken(t)
    } catch (e) { setError(msg(e)) }
  }

  const logout = async () => {
    try { await axios.post(`${API}/logout`, {}, auth) } catch { /* ignore */ }
    logoutLocal()
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) await axios.put(`${API}/products/${editId}`, form, auth)
      else await axios.post(`${API}/products`, form, auth)
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
    try { await axios.delete(`${API}/products/${id}`, auth); load() }
    catch (e) { setError(msg(e)) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (!token) {
    return (
      <div className="card narrow">
        <h1>Login</h1>
        <form onSubmit={login}>
          <input placeholder="Username" value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })} required />
          <input type="password" placeholder="Password" value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })} required />
          <button>Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  return (
    <div className="card">
      <header>
        <h1>Products</h1>
        <button className="ghost" onClick={logout}>Logout</button>
      </header>
      {error && <p className="error">{error}</p>}

      <form className="row" onSubmit={save}>
        <input placeholder="Product name" value={form.product_name} onChange={set('product_name')} required />
        <input placeholder="Description" value={form.description} onChange={set('description')} />
        <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={set('price')} required />
        <input type="number" placeholder="Qty" value={form.quantity} onChange={set('quantity')} required />
        <button>{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" className="ghost"
          onClick={() => { setEditId(null); setForm(emptyForm) }}>Cancel</button>}
      </form>

      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Price</th><th>Qty</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.product_name}</td>
              <td>{p.description}</td>
              <td>₱{p.price}</td>
              <td>{p.quantity}</td>
              <td className="actions">
                <button onClick={() => edit(p)}>Edit</button>
                <button className="danger" onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!products.length && <tr><td colSpan="5">No products yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}