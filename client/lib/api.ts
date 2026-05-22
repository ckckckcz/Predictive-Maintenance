import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Request interceptor to automatically add JWT access token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token")
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to extract data envelope and handle 401 token refresh
api.interceptors.response.use(
    (response) => {
        if (response.data && response.data.success === true) {
            return response.data.data !== undefined ? response.data.data : response.data
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config
        const isLoginRequest = originalRequest.url && originalRequest.url.includes("/auth/login")
        if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
            originalRequest._retry = true
            try {
                const refreshToken = localStorage.getItem("refreshToken")
                if (refreshToken) {
                    const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                        refresh_token: refreshToken,
                    })

                    if (res.data && res.data.success && res.data.data) {
                        const { access_token, refresh_token } = res.data.data
                        localStorage.setItem("token", access_token)
                        if (refresh_token) {
                            localStorage.setItem("refreshToken", refresh_token)
                        }
                        originalRequest.headers.Authorization = `Bearer ${access_token}`
                        return axios(originalRequest)
                    }
                }
            } catch (refreshError) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token")
                    localStorage.removeItem("refreshToken")
                    localStorage.removeItem("user")
                    window.location.href = "/login"
                }
            }
        }

        // Extract error message from API response if present
        const apiError = error.response?.data?.error?.message || error.message
        return Promise.reject(new Error(apiError))
    }
)
