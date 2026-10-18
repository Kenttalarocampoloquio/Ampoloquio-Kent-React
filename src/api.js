import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
})

// Attach the access token to every request
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('access_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// On 401, try /refresh once, save the new (rotated) tokens, then retry
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const refresh = localStorage.getItem('refresh_token')
    const isAuthCall = original?.url?.includes('/login') || original?.url?.includes('/refresh')

    if (err.response?.status === 401 && refresh && !original._retried && !isAuthCall) {
      original._retried = true
      try {
        refreshing ??= axios
          .post(`${api.defaults.baseURL}/refresh`, { refresh_token: refresh })
          .finally(() => { refreshing = null })
        const { data } = await refreshing
        localStorage.setItem('access_token', data.tokens.access_token)
        localStorage.setItem('refresh_token', data.tokens.refresh_token)
        original.headers.Authorization = `Bearer ${data.tokens.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    return Promise.reject(err)
  }
)

export default api
