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

// Polygon mainnet configuration
const POLYGON_CHAIN_ID = 137
// Correct 1inch Limit Order Protocol v4 contract address for Polygon
const POLYGON_LIMIT_ORDER_CONTRACT = "0x111111125421ca6dc452d289314280a0f8842a65" // 1inch Limit Order Protocol v4 on Polygon

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { account, signer, provider } = useWallet()

  const checkAndApproveToken = async (tokenAddress: string, amount: bigint) => {
    console.log("[OrderContext] checkAndApproveToken called", { tokenAddress, amount })
    if (!signer || !account || !provider) {
      console.error("[OrderContext] Wallet not connected", { signer, account, provider })
      throw new Error("Wallet not connected")
    }
    // Use Polygon chain ID and get contract address from SDK domain helper
    const chainId = POLYGON_CHAIN_ID
    const domain = getLimitOrderV4Domain(chainId)
    const limitOrderContractAddress = domain.verifyingContract
    console.log("[OrderContext] LimitOrder domain for approval:", domain)
    if (limitOrderContractAddress.toLowerCase() !== POLYGON_LIMIT_ORDER_CONTRACT.toLowerCase()) {
      console.warn("[OrderContext] WARNING: SDK returned unexpected contract address for Polygon!", limitOrderContractAddress)
    }
    const tokenContract = new ethers.Contract(tokenAddress, erc20AbiFragment, signer)
    try {
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, limitOrderContractAddress)
      console.log("[OrderContext] Current allowance:", currentAllowance.toString())
      if (currentAllowance < amount) {
        console.log(`[OrderContext] Approving token ${tokenAddress} for amount ${amount}`)
        // Approve the required amount (or MaxUint256 for unlimited approval)
        const approveTx = await tokenContract.approve(limitOrderContractAddress, amount)
        console.log("[OrderContext] Approval transaction sent:", approveTx.hash)
        await approveTx.wait()
        console.log("[OrderContext] Token approval confirmed")
      } else {
        console.log("[OrderContext] Token already approved")
      }
    } catch (error) {
      console.error("[OrderContext] Token approval failed:", error)
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const createOrder = async (orderData: Partial<Order>) => {
    console.log("[OrderContext] createOrder called", orderData)
    if (!signer || !account || !provider) {
      console.error("[OrderContext] Wallet not connected", { signer, account, provider })
      throw new Error("Wallet not connected")
    }
    try {
      setIsLoading(true)
      // Validate required fields
      if (!orderData.makerAsset || !orderData.takerAsset || !orderData.makingAmount || !orderData.takingAmount) {
        console.error("[OrderContext] Missing required order data", orderData)
        throw new Error("Missing required order data")
      }
      // Convert string amounts to BigInt
      const makingAmount = BigInt(orderData.makingAmount)
      const takingAmount = BigInt(orderData.takingAmount)
      // Get domain and contract address from SDK
      const chainId = POLYGON_CHAIN_ID
      const domain = getLimitOrderV4Domain(chainId)
      const limitOrderContractAddress = domain.verifyingContract
      console.log("[OrderContext] LimitOrder domain for signing:", domain)
      if (limitOrderContractAddress.toLowerCase() !== POLYGON_LIMIT_ORDER_CONTRACT.toLowerCase()) {
        console.warn("[OrderContext] WARNING: SDK returned unexpected contract address for Polygon!", limitOrderContractAddress)
      }
      // Check and approve token if needed
      await checkAndApproveToken(orderData.makerAsset, makingAmount)
      // Create expiration timestamp (24 hours from now)
      const expiresIn = 86400n // 24 hours in seconds
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn
      // Generate unique salt
      const salt = BigInt(Math.floor(Math.random() * 1e16)) // Larger salt for better uniqueness
      // Use SDK MakerTraits builder for correct bitmask
      let makerTraits = new MakerTraits(0n);
      makerTraits.withExpiration(expiration);
      makerTraits.allowPartialFills();
      makerTraits.allowMultipleFills();
      console.log("makerTraits.asBigInt():", makerTraits.asBigInt().toString());
      // Create the LimitOrder using the SDK
      const order = new LimitOrder({
        makerAsset: new Address(orderData.makerAsset),
        takerAsset: new Address(orderData.takerAsset),
        makingAmount,
        takingAmount,
        maker: new Address(account),
        receiver: new Address(account), // Always set to user's address
        salt
      }, makerTraits)
      // Get typed data for signing
      const typedData = order.getTypedData(Number(domain.chainId))
      // Adapt domain format for signTypedData
      const domainForSignature = {
        ...typedData.domain,
        chainId: chainId,
        verifyingContract: POLYGON_LIMIT_ORDER_CONTRACT // always use the correct Polygon contract
      }
      // Sign the order using EIP-712
      console.log("[OrderContext] Signing order with domain:", domainForSignature)
      const signature = await signer.signTypedData(
        domainForSignature,
        { Order: typedData.types.Order },
        typedData.message
      )
      // Get the order hash
      const orderHash = order.getOrderHash(Number(domain.chainId))
      // Build the order payload
      const builtOrder = order.build() as any
      // Do not add or overwrite any fields in builtOrder
      console.log('order.build() output:', builtOrder)
      let data = { ...builtOrder };
      if ('extension' in builtOrder) {
        data.extension = builtOrder.extension;
      }
      let payload = {
        orderHash,
        signature,
        data
      }
      console.log("[OrderContext] Submitting order using our API route...")
      console.log("[OrderContext] Order submission payload:", payload)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[OrderContext] Order creation failed:", errorData)
        throw new Error(errorData.message || "Failed to create order")
      }
      const result = await response.json()
      console.log("[OrderContext] Order submitted successfully:", result)
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
        status: "active" as Order["status"],
        createdAt: Date.now(),
        orderHash,
        makerTraits: makerTraits.asBigInt().toString()
      }
      setActiveOrders((prev) => {
        const updated = [...prev, newOrder]
        console.log("[OrderContext] setActiveOrders:", updated)
        return updated
      })
      return result
    } catch (error) {
      console.error("[OrderContext] Failed to create order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    console.log("[OrderContext] cancelOrder called", { orderId })
    if (!signer || !account) {
      console.error("[OrderContext] Wallet not connected", { signer, account })
      throw new Error("Wallet not connected")
    }
    try {
      setIsLoading(true)
      // Find the order to cancel
      const order = activeOrders.find((o) => o.id === orderId)
      if (!order) {
        console.error("[OrderContext] Order not found", { orderId, activeOrders })
        throw new Error("Order not found")
      }
      // Note: Actual order cancellation would require an on-chain transaction
      // This is a simplified version that just moves the order to history
      console.log("[OrderContext] Cancelling order:", orderId)
      setActiveOrders((prev) => {
        const updated = prev.filter((o) => o.id !== orderId)
        console.log("[OrderContext] setActiveOrders after cancel:", updated)
        return updated
      })
      setOrderHistory((prev) => {
        const updated = [...prev, { ...order, status: "cancelled" as Order["status"] }]
        console.log("[OrderContext] setOrderHistory after cancel:", updated)
        return updated
      })
      console.log("[OrderContext] Order cancelled successfully")
    } catch (error) {
      console.error("[OrderContext] Failed to cancel order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshOrders = async () => {
    console.log("[OrderContext] refreshOrders called")
    if (!account) {
      console.warn("[OrderContext] refreshOrders: No account connected")
      return
    }
    try {
      setIsLoading(true)
      // Fetch orders from our API
      const response = await fetch(`/api/orders?address=${account}&limit=100`)
      if (!response.ok) {
        console.warn("[OrderContext] Failed to fetch orders from API", response.status)
        return
      }
      const apiResponse = await response.json()
      console.log("[OrderContext] Fetched orders:", apiResponse)
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
        console.log("[OrderContext] setActiveOrders after refresh:", active)
        console.log("[OrderContext] setOrderHistory after refresh:", history)
      }
    } catch (error) {
      console.error("[OrderContext] Failed to refresh orders:", error)
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