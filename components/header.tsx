"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { formatAddress } from "@/lib/utils"
import { Wallet, LogOut } from "lucide-react"

export function Header() {
  const { account, isConnected, isConnecting, connect, disconnect } = useWallet()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
            <span className="text-background font-bold text-sm">1</span>
          </div>
          <h1 className="text-xl font-semibold">Limit Orders</h1>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{formatAddress(account!)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="flex items-center space-x-1 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button onClick={connect} disabled={isConnecting} className="flex items-center space-x-1">
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
