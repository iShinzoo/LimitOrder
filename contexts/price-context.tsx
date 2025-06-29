"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PriceData {
  price: string
  timestamp: number
}

interface PriceContextType {
  ethPrice: PriceData | null
  isLoading: boolean
  error: string | null
  refreshPrice: () => Promise<void>
  testEnvironment: () => Promise<void>
}

const PriceContext = createContext<PriceContextType | undefined>(undefined)

export function PriceProvider({ children }: { children: ReactNode }) {
  const [ethPrice, setEthPrice] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching price from /api/price...")

      // Try the main price endpoint first
      let res = await fetch("/api/price", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Price API response status:", res.status)

      // If the main endpoint fails, try the whitelisted endpoint
      if (!res.ok) {
        console.log("Main price endpoint failed, trying whitelisted endpoint...")
        res = await fetch("/api/price-whitelisted", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        console.log("Whitelisted API response status:", res.status)
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
        const errorMessage = errorData.message || `HTTP ${res.status}`
        console.error("Price API error:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await res.json()
      console.log("Price data received:", data)

      if (!data.price) {
        throw new Error("Invalid price data received")
      }

      setEthPrice({
        price: data.price,
        timestamp: data.timestamp,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch price"
      setError(errorMessage)
      console.error("Price fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testEnvironment = async () => {
    try {
      console.log("Testing environment variables...")
      const res = await fetch("/api/test-env")
      const data = await res.json()
      console.log("Environment test result:", data)
      
      if (!data.hasApiKey) {
        setError("API key is not configured. Please check your .env.local file.")
      } else {
        console.log("API key is configured correctly")
      }
    } catch (err) {
      console.error("Environment test failed:", err)
    }
  }

  const refreshPrice = async () => {
    await fetchPrice()
  }

  useEffect(() => {
    // Test environment first
    testEnvironment()
    
    // Then fetch price
    fetchPrice()
    
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <PriceContext.Provider
      value={{
        ethPrice,
        isLoading,
        error,
        refreshPrice,
        testEnvironment,
      }}
    >
      {children}
    </PriceContext.Provider>
  )
}

export function usePrice() {
  const context = useContext(PriceContext)
  if (context === undefined) {
    throw new Error("usePrice must be used within a PriceProvider")
  }
  return context
}
