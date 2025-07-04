"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TokenPairSelector, Token } from "@/components/token-pair-selector"
import { formatPrice, formatTimestamp } from "@/lib/utils"
import { RefreshCw, TrendingUp, AlertCircle, Settings } from "lucide-react"
import { toast } from "sonner"


const CACHE_KEY = "price-cache-v1"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in ms

function getCache(base: string, quote: string) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")
    const key = `${base}_${quote}`
    return cache[key]
  } catch {
    return undefined
  }
}

function setCache(base: string, quote: string, price: string, timestamp: number) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")
    const key = `${base}_${quote}`
    cache[key] = { price, timestamp }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export function PriceDisplay() {
const [baseToken, setBaseToken] = useState<Token | null>(null)
  const [quoteToken, setQuoteToken] = useState<Token | null>(null)
  const [price, setPrice] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)

// Load default tokens
  useEffect(() => {
    fetch("/tokenlist.json")
      .then((res) => res.json())
      .then((data) => {
        const defaultBase = data.tokens[0]
        const defaultQuote = data.tokens[1]
        setBaseToken(defaultBase)
        setQuoteToken(defaultQuote)
      })
  }, [])

  // Test environment configuration
  const testEnvironment = async () => {
    try {
      const response = await fetch("/api/test-env")
      const data = await response.json()
      
      if (data.status === "success") {
        toast.success("Environment configured correctly", {
          description: `API key length: ${data.apiKeyLength} characters`
        })
      } else {
        toast.error("Environment not configured", {
          description: data.instructions
        })
      }
    } catch (error) {
      toast.error("Failed to test environment", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  // TODO: PRICE_LOGIC_FIX - Implement real-time price updates instead of 24h cache
  // TODO: PRICE_LOGIC_FIX - Add websocket connection for live price feeds
  // TODO: PRICE_LOGIC_FIX - Integrate with order form for suggested pricing
  // Fetch price for selected pair, but only if 24h have passed or no cache
  const fetchPrice = async (baseAddr: string, quoteAddr: string, force = false) => {
    setIsLoading(true)
    setError(null)
    setPrice("")
    setTimestamp(null)
    try {
      const cache = getCache(baseAddr, quoteAddr)
      const now = Date.now()
      if (!force && cache && now - cache.timestamp < CACHE_TTL) {
        setPrice(cache.price)
        setTimestamp(cache.timestamp)
        setIsLoading(false)
        return
      }
      const url = `/api/price?base=${baseAddr}&quote=${quoteAddr}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPrice(data.price)
      setTimestamp(data.timestamp)
      setCache(baseAddr, quoteAddr, data.price, data.timestamp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch price")
    } finally {
      setIsLoading(false)
    }
  }

// On token change, use cache if available, otherwise fetch
  useEffect(() => {
    if (baseToken && quoteToken && baseToken.address !== quoteToken.address) {
      const cache = getCache(baseToken.address, quoteToken.address)
      if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        setPrice(cache.price)
        setTimestamp(cache.timestamp)
      } else {
        fetchPrice(baseToken.address, quoteToken.address)
      }
    }
  }, [baseToken, quoteToken])


  return (
    <Card className="max-w-md mx-auto mt-10 rounded-3xl shadow-lg bg-card border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="text-muted-foreground">Price Display</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={testEnvironment}
            className="h-8 w-8 p-0 rounded-full hover:bg-[hsl(var(--accent))]/10"
            title="Test Environment"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => baseToken && quoteToken && fetchPrice(baseToken.address, quoteToken.address, true)}
            disabled={isLoading} 
            className="h-8 w-8 p-0 rounded-full hover:bg-[hsl(var(--accent))]/10"
            title="Refresh Price (force update)"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TokenPairSelector
          baseToken={baseToken}
          quoteToken={quoteToken}
          onChange={(base, quote) => {
            setBaseToken(base)
            setQuoteToken(quote)
          }}
          className="mb-4"
          baseLabel="Base Token"
          quoteLabel="Quote Token"
        />
        
        <div className="text-center mb-4">
          <div className="text-sm text-muted-foreground mb-2">
            When 1 {baseToken?.symbol || "---"} is worth
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {error ? "-" : price ? formatPrice(price, quoteToken?.decimals || 2) : "..."}
          </div>
          <div className="text-lg text-muted-foreground">
            {quoteToken?.symbol || "---"}
          </div>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-destructive text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {timestamp && !error && (
          <div className="text-xs text-muted-foreground text-center mt-1">
            Last updated: {formatTimestamp(timestamp)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
