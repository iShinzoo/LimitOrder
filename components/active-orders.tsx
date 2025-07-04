"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/contexts/order-context"
import { formatPrice, formatTimestamp } from "@/lib/utils"
import { X, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI: string
}

export function ActiveOrders() {
  const { activeOrders, cancelOrder, refreshOrders, isLoading } = useOrders()
  const [tokens, setTokens] = useState<Token[]>([])

  // Load token list
  useEffect(() => {
    fetch("/tokenlist.json")
      .then((res) => res.json())
      .then((data) => {
        setTokens(data.tokens)
      })
      .catch((error) => {
        console.error("Failed to load token list:", error)
        toast.error("Failed to load token list")
      })
  }, [])

  const getTokenInfo = (address: string) => {
    return tokens.find(t => t.address.toLowerCase() === address.toLowerCase())
  }

  const getOrderType = (order: any) => {
    const makerToken = getTokenInfo(order.makerAsset)
    const takerToken = getTokenInfo(order.takerAsset)
    if (!makerToken || !takerToken) return "UNKNOWN"
    // If the user is selling the makerToken for takerToken, it's a SELL
    // If the user is buying the makerToken with takerToken, it's a BUY
    // Use a simple convention: if makerToken is a stablecoin, it's a BUY; otherwise, SELL
    const stablecoins = ["USDC", "USDT", "DAI"]
    if (stablecoins.includes(makerToken.symbol)) return "BUY"
    if (stablecoins.includes(takerToken.symbol)) return "SELL"
    // Otherwise, use alphabetical order for consistency
    return makerToken.symbol < takerToken.symbol ? "SELL" : "BUY"
  }

  const getOrderDetails = (order: any) => {
    const makerToken = getTokenInfo(order.makerAsset)
    const takerToken = getTokenInfo(order.takerAsset)
    if (!makerToken || !takerToken) {
      return {
        amount: "?",
        price: "?",
        symbol: "Unknown"
      }
    }
    // Validate and format amounts
    let amount = formatPrice(order.makingAmount, makerToken.decimals)
    let price = formatPrice(order.takingAmount, takerToken.decimals)
    // Cap absurdly large values
    if (parseFloat(amount.replace(/,/g, '')) > 1e9) amount = '>1B'
    if (parseFloat(price.replace(/,/g, '')) > 1e9) price = '>1B'
    return {
      amount,
      price,
      symbol: makerToken.symbol
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId)
      toast.success("Order cancelled successfully")
    } catch (error) {
      console.error("Failed to cancel order:", error)
      toast.error("Failed to cancel order", {
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }

  return (
    <div className="bg-[#1a1f2e] border border-gray-700 rounded-2xl">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-700">
        <button className="flex-1 px-6 py-4 text-white font-medium bg-gray-700/50 rounded-tl-2xl">
          Active Orders ({activeOrders.length})
        </button>
        <button className="flex-1 px-6 py-4 text-gray-400 hover:text-white transition-colors">
          Order History (0)
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading orders...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No active orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const orderType = getOrderType(order)
              const details = getOrderDetails(order)
              
              return (
                <div key={order.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={orderType === "SELL" ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                        {orderType}
                      </Badge>
                      <span className="font-medium text-white">{details.amount} {details.symbol}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Price</p>
                      <p className="font-medium text-white">${details.price} USDC</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Created</p>
                      <p className="font-medium text-white">{formatTimestamp(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
