"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/contexts/wallet-context"
import { useOrders } from "@/contexts/order-context"
import { getExpirationTimestamp } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI: string
}

export function OrderForm() {
  const { isConnected } = useWallet()
  const { createOrder, isLoading } = useOrders()
  const [tokens, setTokens] = useState<Token[]>([])

  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [price, setPrice] = useState("")
  const [amount, setAmount] = useState("")
  const [expiration, setExpiration] = useState("1d")
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!price || Number.parseFloat(price) <= 0) {
      newErrors.price = "Price must be greater than 0"
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Get WETH and USDC tokens from the list
      const wethToken = tokens.find(t => t.symbol === "WETH")
      const usdcToken = tokens.find(t => t.symbol === "USDC")

      if (!wethToken || !usdcToken) {
        toast.error("Required tokens not found")
        return
      }

      const priceValue = Number.parseFloat(price)
      const amountValue = Number.parseFloat(amount)

      const orderData = {
        makerAsset:
          orderType === "sell"
            ? wethToken.address // WETH
            : usdcToken.address, // USDC
        takerAsset:
          orderType === "sell"
            ? usdcToken.address // USDC
            : wethToken.address, // WETH
        makingAmount:
          orderType === "sell"
            ? (amountValue * Math.pow(10, wethToken.decimals)).toString()
            : (amountValue * priceValue * Math.pow(10, usdcToken.decimals)).toString(),
        takingAmount:
          orderType === "sell"
            ? (amountValue * priceValue * Math.pow(10, usdcToken.decimals)).toString()
            : (amountValue * Math.pow(10, wethToken.decimals)).toString(),
        expiration: getExpirationTimestamp(expiration),
      }

      await createOrder(orderData)

      // Show success message
      toast.success(`${orderType.toUpperCase()} order created successfully!`, {
        icon: <CheckCircle className="h-4 w-4" />,
      })

      // Reset form
      setPrice("")
      setAmount("")
      setExpiration("1d")
      setErrors({})
    } catch (error) {
      console.error("Failed to create order:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create order", {
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Connect wallet to place orders</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "buy" | "sell")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="text-green-600">
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-red-600">
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value={orderType} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USDC)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <div className="text-sm text-destructive">{errors.price}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (WETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && <div className="text-sm text-destructive">{errors.amount}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {price && amount && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">
                        {(Number.parseFloat(price) * Number.parseFloat(amount)).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Order..." : `Place ${orderType} Order`}
              </Button>
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}
