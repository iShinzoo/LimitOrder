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
          <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-2">
                    <OrderForm />
                  </div>
                  <div className="lg:col-span-3">
                    <ActiveOrders />
                  </div>
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
