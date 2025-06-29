import axios from "axios"

export const apiClient = axios.create({
  baseURL: "https://api.1inch.dev",
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_1INCH_API_KEY || ""}`,
    "Content-Type": "application/json",
  },
})

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)
