"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  account: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchToSepolia: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Sepolia testnet configuration
const SEPOLIA_CHAIN_ID = 11155111
const SEPOLIA_NETWORK = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const switchToSepolia = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not installed")
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          })
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError)
          throw new Error("Failed to add Sepolia network to MetaMask")
        }
      } else {
        console.error("Failed to switch to Sepolia:", switchError)
        throw new Error("Failed to switch to Sepolia network")
      }
    }
  }

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!")
      return
    }

    try {
      setIsConnecting(true)
      
      // Switch to Sepolia testnet
      await switchToSepolia()
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setSigner(signer)
      setAccount(address)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setAccount(accounts[0])
        }
      }

      const handleChainChanged = (chainId: string) => {
        // Reload the page when the chain changes
        window.location.reload()
      }

      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged)
        window.ethereum.on("chainChanged", handleChainChanged)
        
        return () => {
          if (window.ethereum) {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            window.ethereum.removeListener("chainChanged", handleChainChanged)
          }
        }
      }
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        isConnected: !!account,
        isConnecting,
        connect,
        disconnect,
        switchToSepolia,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
