"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice, formatTimestamp } from "@/lib/utils"
import { RefreshCw, TrendingUp, AlertCircle, Settings } from "lucide-react"
import { toast } from "sonner"

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI: string
}

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
  const [tokens, setTokens] = useState<Token[]>([])
  const [base, setBase] = useState<string>("")
  const [quote, setQuote] = useState<string>("")
  const [price, setPrice] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)

  // Load token list
  useEffect(() => {
    fetch("/tokenlist.json")
      .then((res) => res.json())
      .then((data) => {
        setTokens(data.tokens)
        setBase(data.tokens[0].address)
        setQuote(data.tokens[1].address)
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
    if (base && quote && base !== quote) {
      const cache = getCache(base, quote)
      if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        setPrice(cache.price)
        setTimestamp(cache.timestamp)
      } else {
        fetchPrice(base, quote)
      }
    }
  }, [base, quote])

  const baseToken = tokens.find((t) => t.address === base)
  const quoteToken = tokens.find((t) => t.address === quote)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>When 1</span>
          <Select value={base} onValueChange={setBase}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.address} value={token.address}>
                  <span className="inline-flex items-center gap-2">
                    <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                    {token.symbol}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>is worth</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={testEnvironment}
            className="h-8 w-8 p-0"
            title="Test Environment"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchPrice(base, quote, true)} 
            disabled={isLoading} 
            className="h-8 w-8 p-0"
            title="Refresh Price (force update)"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold">
            {error ? "-" : price ? formatPrice(price, quoteToken?.decimals || 2) : "..."}
          </span>
          {quoteToken && (
            <Select value={quote} onValueChange={setQuote}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.filter((t) => t.address !== base).map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <span className="inline-flex items-center gap-2">
                      <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                      {token.symbol}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-destructive text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>Error: {error}</span>
          </div>
        )}
        {timestamp && (
          <div className="text-xs text-muted-foreground mt-1">Last updated: {formatTimestamp(timestamp)}</div>
        )}
      </CardContent>
    </Card>
  )
}
