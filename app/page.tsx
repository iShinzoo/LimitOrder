"use client"
import { WalletProvider } from "@/contexts/wallet-context"
import { OrderProvider } from "@/contexts/order-context"
import { PriceProvider } from "@/contexts/price-context"
import { Header } from "@/components/header"
import { PriceDisplay } from "@/components/price-display"
import { OrderForm } from "@/components/order-form"
import { ActiveOrders } from "@/components/active-orders"
import { OrderHistory } from "@/components/order-history"
import { Toaster } from "sonner"

export default function Home() {
  return (
    <WalletProvider>
      <PriceProvider>
        <OrderProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <PriceDisplay />
                  <OrderForm />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <ActiveOrders />
                  <OrderHistory />
                </div>
              </div>
            </main>
            <Toaster position="top-right" />
          </div>
        </OrderProvider>
      </PriceProvider>
    </WalletProvider>
  )
}
