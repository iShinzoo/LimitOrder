# Crypto Limit Orders

A Next.js application for creating and managing limit orders using the 1inch Orderbook API on **Polygon Mainnet**.

## Features

- **Wallet Integration**: Connect with MetaMask or other Web3 wallets
- **Real-time Price Display**: Live WETH/USDC price from 1inch Price API
- **Limit Order Creation**: Create buy/sell limit orders with customizable parameters
- **Order Management**: View active orders and order history
- **Order Cancellation**: Cancel active orders
- **Token Support**: Support for WETH, USDC, USDT, DAI, and WBTC on Polygon mainnet
- **Responsive UI**: Modern, responsive interface built with Tailwind CSS and shadcn/ui
- **Network Support**: Configured for Polygon mainnet

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Web3**: Ethers.js for wallet integration
- **APIs**: 1inch Price API and Orderbook API
- **Notifications**: Sonner for toast notifications
- **Network**: Polygon Mainnet

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-limit-orders
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_1INCH_API_KEY=your_1inch_api_key_here
   ```

4. **Get 1inch API Key**
   - Visit [1inch Developer Portal](https://portal.1inch.dev/)
   - Sign up and get your API key
   - Add it to your `.env.local` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Using Polygon Mainnet

This application is configured to work with **Polygon Mainnet**.

### Polygon Token Addresses

2. **Tokens**: The app uses these Polygon mainnet token addresses:
   - **WETH**: (update with Polygon WETH address)
   - **USDC**: (update with Polygon USDC address)
   - **USDT**: (update with Polygon USDT address)
   - **DAI**: (update with Polygon DAI address)
   - **WBTC**: (update with Polygon WBTC address)

### Setting up MetaMask

1. **Add Polygon Network**: The app will automatically prompt you to add Polygon to MetaMask
2. **Switch to Polygon**: The app will automatically switch to Polygon when you connect
3. **Import Tokens**: You can import the tokens using their addresses above

## Usage

### Connecting Wallet
1. Click "Connect Wallet" in the header
2. Approve the connection in your wallet (MetaMask, etc.)
3. The app will automatically switch to Polygon mainnet
4. Your wallet address will be displayed in the header

### Creating Limit Orders
1. **Select Order Type**: Choose "Buy" or "Sell"
2. **Set Price**: Enter the price in USDC per WETH
3. **Set Amount**: Enter the amount of WETH to buy/sell
4. **Set Expiration**: Choose when the order expires (1 hour, 1 day, 1 week)
5. **Approve Tokens**: The app will automatically check and request token approvals
6. **Submit Order**: Click "Place Order" to create your limit order

### Managing Orders
- **View Active Orders**: See all your active limit orders
- **Cancel Orders**: Click the X button to cancel an order
- **Order History**: View completed, cancelled, and expired orders
- **Refresh**: Use the refresh button to update order status

## Important Notes

- **Polygon Mainnet Only**: This application is configured for Polygon mainnet only
- **Token Approvals**: The app will automatically request token approvals when needed
- **Order Expiration**: Orders expire after the selected time period
- **Network Switching**: The app automatically handles network switching to Polygon

## Troubleshooting

### Common Issues

- Make sure you have MATIC for gas fees on Polygon mainnet
- Ensure MetaMask is set to Polygon mainnet
- If tokens are not visible, import them manually using the addresses above

## API Endpoints

### Price API
- `GET /api/price` - Get current WETH/USDC price
- `POST /api/price` - Alternative method for price fetching

### Orders API
- `POST /api/orders` - Create a new limit order
- `GET /api/orders?address={address}` - Get orders for a specific address

## Architecture

### Components
- `Header` - Wallet connection and navigation
- `PriceDisplay` - Real-time price display with token selection
- `OrderForm` - Limit order creation form
- `ActiveOrders` - Display and manage active orders
- `OrderHistory` - View order history

### Contexts
- `WalletProvider` - Wallet connection state management
- `PriceProvider` - Price data and API calls
- `OrderProvider` - Order creation and management

### Key Features
- **EIP-712 Signing**: Secure order signing using Ethereum's typed data standard
- **Token Decimal Handling**: Proper handling of different token decimals
- **Native Unwrapping**: Automatic unwrapping of WETH to ETH when selling
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Loading indicators for better UX
- **Toast Notifications**: Success/error feedback using Sonner

## Security

- API keys are stored in environment variables
- Orders are signed using EIP-712 for security
- No private keys are stored in the application
- All transactions require wallet approval

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 