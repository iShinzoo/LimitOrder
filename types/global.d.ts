interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (accounts: string[] | string) => void) => void
    removeListener: (event: string, callback: (accounts: string[] | string) => void) => void
    send: (method: string, params: any[]) => Promise<any>
  }
}
