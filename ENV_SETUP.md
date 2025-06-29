# Environment Setup Guide

## Setting up your 1inch API Key

1. **Get your 1inch API key:**
   - Go to [1inch Developer Portal](https://portal.1inch.dev/)
   - Sign up or log in
   - Create a new API key
   - Copy the API key

2. **Create environment file:**
   - In your project root, create a file called `.env.local`
   - Add your API key:
   ```
   NEXT_PUBLIC_1INCH_API_KEY=your_actual_api_key_here
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Test the setup:**
   - Open your browser console
   - Visit `http://localhost:3000/api/test-env` to verify the API key is loaded
   - Check the price display component for any errors

## API Endpoints

The application now uses the correct 1inch Price API endpoints:

- **Main endpoint**: `/api/price` - Uses the price/v1.1 endpoint with specific token addresses
- **Fallback endpoint**: `/api/price-whitelisted` - Uses the price/v1.1 endpoint to get all whitelisted tokens
- **Test endpoint**: `/api/test-env` - Verifies environment variables

## Troubleshooting

### If you still get 502 errors:

1. **Check the API key format:**
   - Make sure there are no extra spaces or quotes
   - The key should be a long string of characters

2. **Verify the file name:**
   - The file must be named exactly `.env.local` (not `.env` or `.env.local.txt`)

3. **Check the variable name:**
   - Must be exactly `NEXT_PUBLIC_1INCH_API_KEY`

4. **Restart the server:**
   - Environment variables are only loaded when the server starts

5. **Check browser console:**
   - Look for detailed error messages
   - Use the test environment button in the price display

### Common Issues:

- **"API key not configured"**: The `.env.local` file is missing or incorrectly named
- **"Invalid API key"**: The API key is incorrect or expired
- **"Rate limit exceeded"**: You've hit the API rate limit (wait a minute and try again)
- **"No proxy config found"**: This was fixed by switching to the correct price/v1.1 endpoint

## Testing

You can test your setup by visiting:
- `http://localhost:3000/api/test-env` - Check if environment variables are loaded
- `http://localhost:3000/api/price` - Test the main price API
- `http://localhost:3000/api/price-whitelisted` - Test the whitelisted tokens API

## API Changes Made

The application was updated to use the correct 1inch Price API endpoints:

1. **Changed from spot-price/v1.1 to price/v1.1** - This fixes the "No proxy config found" error
2. **Added fallback to whitelisted tokens** - If specific tokens fail, it tries to get all whitelisted tokens
3. **Improved error handling** - Better error messages and logging
4. **Added POST method support** - Alternative approach using POST with tokens payload

The price calculation now correctly uses the price/v1.1 endpoint format as shown in your Python reference code. 