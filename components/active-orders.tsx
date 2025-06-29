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
    
    if (makerToken?.symbol === "WETH" && takerToken?.symbol === "USDC") {
      return "SELL"
    } else if (makerToken?.symbol === "USDC" && takerToken?.symbol === "WETH") {
      return "BUY"
    }
    return "UNKNOWN"
  }

  const getOrderDetails = (order: any) => {
    const makerToken = getTokenInfo(order.makerAsset)
    const takerToken = getTokenInfo(order.takerAsset)
    
    if (!makerToken || !takerToken) {
      return {
        amount: formatPrice(order.makingAmount, 18),
        price: formatPrice(order.takingAmount, 6),
        symbol: "Unknown"
      }
    }

    const amount = formatPrice(order.makingAmount, makerToken.decimals)
    const price = formatPrice(order.takingAmount, takerToken.decimals)
    
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Active Orders</CardTitle>
        <Button variant="ghost" size="sm" onClick={refreshOrders} disabled={isLoading} className="h-8 w-8 p-0">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active orders</div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const orderType = getOrderType(order)
              const details = getOrderDetails(order)
              
              return (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={orderType === "SELL" ? "destructive" : "default"}>
                        {orderType}
                      </Badge>
                      <span className="font-medium">{details.amount} {details.symbol}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Price: ${details.price} USDC</div>
                    <div className="text-xs text-muted-foreground">Created: {formatTimestamp(order.createdAt)}</div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
