"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/contexts/order-context"
import { formatPrice, formatTimestamp } from "@/lib/utils"

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI: string
}

export function OrderHistory() {
  const { orderHistory } = useOrders()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>
      <CardContent>
        {orderHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No order history</div>
        ) : (
          <div className="space-y-4">
            {orderHistory.map((order) => {
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
                    <div className="text-xs text-muted-foreground">{formatTimestamp(order.createdAt)}</div>
                  </div>

                  <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
