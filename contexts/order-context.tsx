"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { ethers, MaxUint256 } from "ethers"
import { LimitOrder, Address, MakerTraits, getLimitOrderV4Domain } from "@1inch/limit-order-sdk"
import { useWallet } from "./wallet-context"

export interface Order {
  id: string
  maker: string
  taker: string
  makerAsset: string
  takerAsset: string
  makingAmount: string
  takingAmount: string
  salt: string
  expiration: number
  signature: string
  status: "active" | "filled" | "cancelled" | "expired"
  createdAt: number
  orderHash?: string
  makerTraits?: string
}

interface OrderContextType {
  activeOrders: Order[]
  orderHistory: Order[]
  isLoading: boolean
  createOrder: (orderData: Partial<Order>) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
  refreshOrders: () => Promise<void>
  checkAndApproveToken: (tokenAddress: string, amount: bigint) => Promise<void>
}

// Standard ERC-20 ABI fragment
const erc20AbiFragment = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
]

// Sepolia testnet configuration
const SEPOLIA_CHAIN_ID = 11155111
const SEPOLIA_LIMIT_ORDER_CONTRACT = "0x1111111254EEB25477B68fb85Ed929f73A960582" // 1inch Limit Order Protocol v4 on Sepolia

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { account, signer, provider } = useWallet()

  const checkAndApproveToken = async (tokenAddress: string, amount: bigint) => {
    if (!signer || !account || !provider) {
      throw new Error("Wallet not connected")
    }

    // Use Sepolia chain ID for testing
    const chainId = SEPOLIA_CHAIN_ID
    const limitOrderContractAddress = SEPOLIA_LIMIT_ORDER_CONTRACT

    const tokenContract = new ethers.Contract(tokenAddress, erc20AbiFragment, signer)

    try {
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, limitOrderContractAddress)
      
      if (currentAllowance < amount) {
        console.log(`Approving token ${tokenAddress} for amount ${amount}`)
        
        // Approve the required amount (or MaxUint256 for unlimited approval)
        const approveTx = await tokenContract.approve(limitOrderContractAddress, amount)
        
        console.log("Approval transaction sent:", approveTx.hash)
        await approveTx.wait()
        console.log("Token approval confirmed")
      } else {
        console.log("Token already approved")
      }
    } catch (error) {
      console.error("Token approval failed:", error)
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const createOrder = async (orderData: Partial<Order>) => {
    if (!signer || !account || !provider) {
      throw new Error("Wallet not connected")
    }

    try {
      setIsLoading(true)

      // Validate required fields
      if (!orderData.makerAsset || !orderData.takerAsset || !orderData.makingAmount || !orderData.takingAmount) {
        throw new Error("Missing required order data")
      }

      // Convert string amounts to BigInt
      const makingAmount = BigInt(orderData.makingAmount)
      const takingAmount = BigInt(orderData.takingAmount)
      
      // Check and approve token if needed
      await checkAndApproveToken(orderData.makerAsset, makingAmount)
      
      // Create expiration timestamp (24 hours from now)
      const expiresIn = BigInt(86400) // 24 hours in seconds
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn
      
      // Generate unique salt
      const salt = BigInt(Math.floor(Math.random() * 1e16)) // Larger salt for better uniqueness
      
      // Create MakerTraits using the builder pattern
      const makerTraits = new MakerTraits(BigInt(0))
        .withExpiration(expiration)
        .allowPartialFills()
        .allowMultipleFills()

      console.log("MakerTraits object:", makerTraits)
      console.log("MakerTraits toString():", makerTraits.toString())

      // Convert makerTraits to a proper string representation
      const makerTraitsString = makerTraits.toString()
      console.log("MakerTraits string:", makerTraitsString)

      // Create the LimitOrder using the SDK
      const order = new LimitOrder({
        makerAsset: new Address(orderData.makerAsset),
        takerAsset: new Address(orderData.takerAsset),
        makingAmount,
        takingAmount,
        maker: new Address(account),
        receiver: new Address(account),
        salt
      })

      // Get the domain for Sepolia testnet
      const chainId = SEPOLIA_CHAIN_ID
      const domain = getLimitOrderV4Domain(chainId)
      
      // Get typed data for signing
      const typedData = order.getTypedData(Number(domain.chainId))

      // Adapt domain format for signTypedData
      const domainForSignature = {
        ...typedData.domain,
        chainId: chainId
      }

      // Sign the order using EIP-712
      const signature = await signer.signTypedData(
        domainForSignature,
        { Order: typedData.types.Order },
        typedData.message
      )
      
      // Get the order hash
      const orderHash = order.getOrderHash(Number(domain.chainId))

      // Use our custom API route for submission (which handles CORS and proper formatting)
      console.log("Submitting order using our API route...")
      
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: {
            makerAsset: orderData.makerAsset,
            takerAsset: orderData.takerAsset,
            makingAmount: makingAmount.toString(),
            takingAmount: takingAmount.toString(),
            maker: account,
            receiver: account,
            salt: salt.toString(),
            makerTraits: makerTraitsString // Use the string representation
          },
          signature
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Order creation failed:", errorData)
        throw new Error(errorData.message || "Failed to create order")
      }

      const result = await response.json()
      console.log("Order submitted successfully:", result)

      // Add to local state
      const newOrder: Order = {
        id: `${salt}-${Date.now()}`,
        maker: account,
        taker: "0x0000000000000000000000000000000000000000",
        makerAsset: orderData.makerAsset,
        takerAsset: orderData.takerAsset,
        makingAmount: orderData.makingAmount,
        takingAmount: orderData.takingAmount,
        salt: salt.toString(),
        expiration: Number(expiration),
        signature,
        status: "active",
        createdAt: Date.now(),
        orderHash,
        makerTraits: makerTraitsString // Use the string representation
      }

      setActiveOrders((prev) => [...prev, newOrder])
      return result
    } catch (error) {
      console.error("Failed to create order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!signer || !account) {
      throw new Error("Wallet not connected")
    }

    try {
      setIsLoading(true)

      // Find the order to cancel
      const order = activeOrders.find((o) => o.id === orderId)
      if (!order) {
        throw new Error("Order not found")
      }

      // Note: Actual order cancellation would require an on-chain transaction
      // This is a simplified version that just moves the order to history
      console.log("Cancelling order:", orderId)

      // Move order from active to history
      setActiveOrders((prev) => prev.filter((o) => o.id !== orderId))
      setOrderHistory((prev) => [...prev, { ...order, status: "cancelled" }])
      
      console.log("Order cancelled successfully")
    } catch (error) {
      console.error("Failed to cancel order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshOrders = async () => {
    if (!account) return

    try {
      setIsLoading(true)

      // Fetch orders from our API
      const response = await fetch(`/api/orders?address=${account}&limit=100`)
      
      if (!response.ok) {
        console.warn("Failed to fetch orders from API")
        return
      }

      const apiResponse = await response.json()
      console.log("Fetched orders:", apiResponse)

      // Process orders from 1inch API format
      if (apiResponse && Array.isArray(apiResponse)) {
        const processedOrders: Order[] = apiResponse.map((apiOrder: any) => ({
          id: `${apiOrder.data?.salt || 'unknown'}-${apiOrder.createDateTime || Date.now()}`,
          maker: apiOrder.data?.maker || '',
          taker: apiOrder.data?.taker || '0x0000000000000000000000000000000000000000',
          makerAsset: apiOrder.data?.makerAsset || '',
          takerAsset: apiOrder.data?.takerAsset || '',
          makingAmount: apiOrder.data?.makingAmount || '0',
          takingAmount: apiOrder.data?.takingAmount || '0',
          salt: apiOrder.data?.salt || '0',
          expiration: apiOrder.data?.expiration || 0,
          signature: apiOrder.signature || '',
          status: apiOrder.status === 'filled' ? 'filled' : 
                   apiOrder.status === 'cancelled' ? 'cancelled' :
                   apiOrder.status === 'expired' ? 'expired' : 'active',
          createdAt: apiOrder.createDateTime || Date.now(),
          orderHash: apiOrder.orderHash,
          makerTraits: apiOrder.data?.makerTraits
        }))

        // Separate active and historical orders
        const active = processedOrders.filter(order => order.status === 'active')
        const history = processedOrders.filter(order => order.status !== 'active')

        setActiveOrders(active)
        setOrderHistory(history)
      }
    } catch (error) {
      console.error("Failed to refresh orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OrderContext.Provider
      value={{
        activeOrders,
        orderHistory,
        isLoading,
        createOrder,
        cancelOrder,
        refreshOrders,
        checkAndApproveToken,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}