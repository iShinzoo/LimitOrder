# Crypto Limit Orders

A Next.js application for creating and managing limit orders using the 1inch Orderbook API on **Sepolia Testnet**.

## Features

- **Wallet Integration**: Connect with MetaMask or other Web3 wallets
- **Real-time Price Display**: Live WETH/USDC price from 1inch Price API
- **Limit Order Creation**: Create buy/sell limit orders with customizable parameters
- **Order Management**: View active orders and order history
- **Order Cancellation**: Cancel active orders
- **Token Support**: Support for WETH, USDC, USDT, DAI, and WBTC on Sepolia testnet
- **Responsive UI**: Modern, responsive interface built with Tailwind CSS and shadcn/ui
- **Testnet Support**: Configured for Sepolia testnet for easy testing

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Web3**: Ethers.js for wallet integration
- **APIs**: 1inch Price API and Orderbook API
- **Notifications**: Sonner for toast notifications
- **Network**: Sepolia Testnet

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

## Testing with Sepolia Testnet

This application is configured to work with **Sepolia Testnet** for easy testing without requiring real ETH.

### Getting Test Tokens

1. **Sepolia ETH**: Get free Sepolia ETH from faucets:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. **Test Tokens**: The app uses these Sepolia testnet token addresses:
   - **WETH**: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
   - **USDC**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
   - **USDT**: `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`
   - **DAI**: `0x68194a729C2450ad26072b3D33ADaCbcef39D574`

### Setting up MetaMask

1. **Add Sepolia Network**: The app will automatically prompt you to add Sepolia to MetaMask
2. **Switch to Sepolia**: The app will automatically switch to Sepolia when you connect
3. **Import Test Tokens**: You can import the test tokens using their addresses above

## Usage

### Connecting Wallet
1. Click "Connect Wallet" in the header
2. Approve the connection in your wallet (MetaMask, etc.)
3. The app will automatically switch to Sepolia testnet
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

- **Testnet Only**: This application is configured for Sepolia testnet only
- **No Real Money**: All transactions use test tokens and test ETH
- **Token Approvals**: The app will automatically request token approvals when needed
- **Order Expiration**: Orders expire after the selected time period
- **Network Switching**: The app automatically handles network switching to Sepolia

## Troubleshooting

### Common Issues

1. **"Failed to connect wallet"**
   - Make sure MetaMask is installed
   - Ensure you're on Sepolia testnet
   - Try refreshing the page

2. **"Token approval failed"**
   - Check that you have enough Sepolia ETH for gas fees
   - Try approving a smaller amount first

3. **"Order creation failed"**
   - Verify you have sufficient token balance
   - Check that the 1inch API key is configured correctly
   - Ensure you're connected to Sepolia testnet

### Getting Help

- Check the browser console for detailed error messages
- Verify your MetaMask is connected to Sepolia testnet
- Ensure you have sufficient test tokens and Sepolia ETH

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