"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWallet } from "@/contexts/wallet-context"
import { formatAddress } from "@/lib/utils"
import { Search, Copy } from "lucide-react"
import { toast } from "sonner"

export function Header() {
  const { account, isConnected, isConnecting, connect, disconnect } = useWallet()

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      toast.success("Address copied to clipboard")
    }
  }

  return (
    <header className="border-b border-gray-800 bg-[#0a0e1a] px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">Lexxo</h1>
            <span className="text-sm text-gray-400">Limit Orders</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search tokens and pools"
              className="w-full pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">{formatAddress(account!)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-auto p-1 text-gray-400 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
