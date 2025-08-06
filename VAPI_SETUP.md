# Vapi Integration Setup

This guide will help you configure Vapi API integration for phone number search and purchasing.

## Prerequisites

1. A Vapi account (sign up at https://vapi.ai)
2. Your Vapi API keys (public and private)

## Vapi Key Types

Vapi provides two types of API keys:

### Public Key
- **Purpose**: Client-side operations like searching for available numbers
- **Security**: Safe to use in client-side code (though we use it server-side for security)
- **Usage**: Searching for available phone numbers

### Private Key
- **Purpose**: Server-side operations like purchasing numbers and account management
- **Security**: Must be kept secret, only used server-side
- **Usage**: Buying numbers, deleting numbers, account management

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/trueleads"
   
   # NextAuth
   NEXTAUTH_SECRET="your-nextauth-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Vapi API Keys
   VAPI_PUBLIC_KEY="your-vapi-public-key-here"
   VAPI_PRIVATE_KEY="your-vapi-private-key-here"
   ```

## Getting Your Vapi API Keys

1. Sign up for a Vapi account at https://vapi.ai
2. Navigate to your dashboard
3. Go to API Keys section
4. Create both public and private keys
5. Copy both keys and add them to your `.env` file

## Features

### Phone Number Search
- Real-time search for available phone numbers using public key
- Search by area code, partial number, or specific digits
- Filter by country (US, Canada, UK, Australia)
- Shows pricing information when available

### Phone Number Purchasing
- Buy numbers directly through Vapi using private key
- Store purchased numbers in your database
- Manage your phone numbers with labels and purposes

## API Endpoints

- `GET /api/vapi/search-numbers` - Search for available numbers (uses public key)
- `GET /api/user-numbers` - Get user's purchased numbers
- `POST /api/user-numbers` - Purchase a new number (uses private key)
- `DELETE /api/user-numbers` - Remove a number (uses private key)

## Usage

1. Start the application: `npm run dev`
2. Navigate to the Phone Numbers page
3. Enter a search term (e.g., "555", "1234", area code)
4. Select your preferred country
5. Choose a label and purpose for the number
6. Click "Buy" to purchase the number

## Error Handling

The application includes comprehensive error handling:
- Invalid API keys
- Network errors
- Rate limiting
- Invalid search queries

## Testing

You can test the integration without real Vapi keys by:
1. Not setting the `VAPI_PUBLIC_KEY` and `VAPI_PRIVATE_KEY` environment variables
2. The application will show appropriate error messages and handle gracefully

## Security Notes

- **Public Key**: Used for searching only, safe for client-side operations
- **Private Key**: Used for purchasing and account management, must be kept secret
- Both keys are stored server-side in environment variables
- Never expose your private key in client-side code 