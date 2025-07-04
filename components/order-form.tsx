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
  const [payToken, setPayToken] = useState<Token | null>(null)
  const [receiveToken, setReceiveToken] = useState<Token | null>(null)

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
        // Set defaults: pay with WMATIC, receive USDC
        const defaultPay = data.tokens.find((t: Token) => t.symbol === "WMATIC") || data.tokens[0]
        const defaultReceive = data.tokens.find((t: Token) => t.symbol === "USDC") || data.tokens[1]
        setPayToken(defaultPay)
        setReceiveToken(defaultReceive)
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
      if (!payToken || !receiveToken) {
        toast.error("Please select both pay and receive tokens")
        return
      }
      if (payToken.address === receiveToken.address) {
        toast.error("Pay and receive tokens must be different")
        return
      }
      const priceValue = Number.parseFloat(price)
      const amountValue = Number.parseFloat(amount)

      // Calculate making/taking amounts based on pay/receive
      // makingAmount: how much you pay (in payToken)
      // takingAmount: how much you want to receive (in receiveToken)
      const makingAmount = (amountValue * Math.pow(10, payToken.decimals)).toString()
      const takingAmount = (amountValue * priceValue * Math.pow(10, receiveToken.decimals)).toString()

      const orderData = {
        makerAsset: payToken.address,
        takerAsset: receiveToken.address,
        makingAmount,
        takingAmount,
        expiration: getExpirationTimestamp(expiration),
      }

      await createOrder(orderData)

      // Show success message
      toast.success(`Order created successfully!`, {
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
      <Card className="bg-[#1a1f2e] border-gray-700 rounded-2xl p-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center py-12">
            <AlertCircle className="h-8 w-8 text-gray-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
              <p className="text-gray-400">Connect your wallet to start creating limit orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1a1f2e] border-gray-700 rounded-2xl p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white mb-2">Create Limit Order</CardTitle>
        <p className="text-gray-400 text-sm mb-6">Set your price and let the market come to you</p>
        
        <div className="space-y-4">
          {/* Price Display Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">When 1 {payToken ? payToken.symbol : "ETH"} is worth</span>
              <button className="text-sm text-blue-400 hover:text-blue-300">Switch</button>
            </div>
            <div className="text-3xl font-bold text-white">
              {price || '0.00'}
            </div>
            <div className="text-gray-400">
              {receiveToken ? receiveToken.symbol : "USDC"}
            </div>
          </div>
          
          {/* Exchange Rate Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">When 1 {receiveToken ? receiveToken.symbol : "USDC"} is worth</span>
            <span className="text-white font-semibold">Infinity</span>
            <span className="text-gray-400">{payToken ? payToken.symbol : "ETH"}</span>
          </div>
          
          {/* Price Preset Buttons */}
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">Market</button>
            <button className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">+1%</button>
            <button className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">+5%</button>
            <button className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">+10%</button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sell Section */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Sell</label>
            <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-4">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`bg-transparent border-none text-xl font-semibold text-white placeholder-gray-500 focus:ring-0 focus:outline-none flex-1 ${errors.amount ? 'border-destructive' : ''}`}
              />
              <Select value={payToken?.address} onValueChange={val => setPayToken(tokens.find(t => t.address === val) || null)}>
                <SelectTrigger className="w-auto bg-transparent border-none text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Ξ</span>
                    </div>
                    <SelectValue>{payToken ? payToken.symbol : "ETH"}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {tokens.map(token => (
                    <SelectItem key={token.address} value={token.address} className="text-white hover:bg-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                        {token.symbol}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>

          {/* Buy Section */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Buy</label>
            <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-4">
              <Input
                id="buy-amount"
                type="number"
                step="0.01"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`bg-transparent border-none text-xl font-semibold text-white placeholder-gray-500 focus:ring-0 focus:outline-none flex-1 ${errors.price ? 'border-destructive' : ''}`}
              />
              <Select value={receiveToken?.address} onValueChange={val => setReceiveToken(tokens.find(t => t.address === val) || null)}>
                <SelectTrigger className="w-auto bg-transparent border-none text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                    <SelectValue>{receiveToken ? receiveToken.symbol : "USDC"}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {tokens.map(token => (
                    <SelectItem key={token.address} value={token.address} className="text-white hover:bg-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                        {token.symbol}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expiry Section */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Expiry</label>
            <div className="flex gap-2">
              {['1 day', '1 week', '1 month', '1 year'].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    expiration === ['1d','1w','1m','1y'][idx] 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setExpiration(['1d','1w','1m','1y'][idx])}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl py-4 text-base font-semibold mt-6"
            disabled={isLoading}
          >
            {isLoading ? 'Create Order' : 'Create Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}