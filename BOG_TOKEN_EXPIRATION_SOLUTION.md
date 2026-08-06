# BOG Token Expiration Solution

## Problem
After 5-10 minutes, users were getting "Unauthorized" errors when trying to make purchases. This was caused by BOG access tokens expiring, which have a short lifespan (typically 15-30 minutes).

## Root Cause
- BOG access tokens expire quickly for security reasons
- The original implementation fetched a token once and used it until it expired
- When tokens expired, all subsequent API calls failed with 401 Unauthorized errors
- No automatic token refresh mechanism was in place

## Solution: BOG Token Manager

### 1. **Automatic Token Management**
- **Singleton Pattern**: Single instance manages all tokens across the application
- **Automatic Refresh**: Tokens are refreshed before they expire (60-second buffer)
- **Smart Caching**: Valid tokens are reused until near expiration

### 2. **Retry Logic with Token Refresh**
- **Automatic Retry**: Failed requests due to expired tokens are automatically retried
- **Token Refresh**: Expired tokens trigger automatic refresh before retry
- **Configurable Retries**: Default 2 retry attempts with configurable limits

### 3. **Implementation Details**

#### Token Manager Class (`src/lib/bog-token.ts`)
```typescript
class BOGTokenManager {
  // Automatic token refresh with 60-second buffer
  private tokenExpiry: number = 0;
  
  // Prevents multiple simultaneous refresh requests
  private isRefreshing: boolean = false;
  
  // Smart token validation and refresh
  async getValidToken(): Promise<string>
  
  // Automatic retry with token refresh
  async makeAuthenticatedRequest<T>(requestFn, maxRetries = 2)
}
```

#### Key Features
- **Token Expiry Buffer**: Refreshes tokens 60 seconds before actual expiration
- **Concurrent Request Handling**: Multiple requests wait for ongoing refresh
- **Error Handling**: Comprehensive error handling with specific error messages
- **Debugging**: Detailed logging for troubleshooting

### 4. **Updated APIs**

#### Create Order API (`/api/create-order`)
- Uses `bogTokenManager.makeAuthenticatedRequest()` for BOG API calls
- Automatic token refresh and retry on 401 errors
- No manual token management required

#### BOG Status Check API (`/api/orders/bog-status/[orderId]`)
- Automatic token refresh for order status checks
- Automatic token refresh for receipt retrieval
- Seamless operation regardless of token age

#### Token API (`/api/token`)
- Simplified to use token manager
- Returns current token info for debugging
- Automatic token refresh when needed

### 5. **Benefits**

#### For Users
- ✅ **No More "Unauthorized" Errors**: Tokens are automatically refreshed
- ✅ **Seamless Experience**: Purchases work regardless of session duration
- ✅ **Reliable Payments**: Automatic retry ensures payment completion

#### For Developers
- ✅ **Centralized Token Management**: Single source of truth for all BOG tokens
- ✅ **Automatic Error Recovery**: No manual intervention required
- ✅ **Comprehensive Logging**: Easy debugging and monitoring
- ✅ **Scalable**: Handles multiple concurrent requests efficiently

### 6. **Testing**

#### Test Endpoint
- **URL**: `/api/test-token`
- **Purpose**: Verify token manager functionality
- **Response**: Token info, expiry times, and manager status

#### Manual Testing
1. Make a purchase
2. Wait 5-10 minutes
3. Try to make another purchase
4. Should work seamlessly without errors

### 7. **Configuration**

#### Environment Variables
```bash
BOG_CLIENT_ID=your_client_id
BOG_CLIENT_SECRET=your_client_secret
```

#### Token Settings
- **Refresh Buffer**: 60 seconds before expiration
- **Max Retries**: 2 attempts per request
- **Timeout**: 10 seconds per API call

### 8. **Monitoring and Debugging**

#### Console Logs
- 🔑 Token requests and refreshes
- 🔄 Automatic retry attempts
- ✅ Successful operations
- ❌ Error details and recovery

#### Token Info
```typescript
{
  hasToken: boolean,
  expiresAt: string,
  isExpired: boolean,
  timeUntilExpiry: number
}
```

## Result
Users can now make purchases at any time without encountering "Unauthorized" errors. The system automatically handles token expiration in the background, providing a seamless shopping experience.

## Future Enhancements
- **Metrics Collection**: Track token refresh frequency and success rates
- **Alert System**: Notify administrators of repeated token failures
- **Token Pooling**: Multiple token management for high-traffic scenarios
- **Circuit Breaker**: Automatic fallback for persistent BOG API issues
