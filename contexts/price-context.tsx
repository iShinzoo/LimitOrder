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
      // Only fetch from /api/price
      let res = await fetch("/api/price", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
        const errorMessage = errorData.message || `HTTP ${res.status}`
        throw new Error(errorMessage)
      }
      const data = await res.json()
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
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPrice = async () => {
    await fetchPrice()
  }

  useEffect(() => {
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
