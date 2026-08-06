# BOG Payment Gateway Setup

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# BOG Payment Gateway Configuration
BOG_CLIENT_ID=your_client_id_here
BOG_CLIENT_SECRET=your_client_secret_here

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/furniture"

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email (for verification)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password_here
EMAIL_FROM=noreply@yourdomain.com
```

## Getting BOG Credentials

1. Register your business with Bank of Georgia
2. Contact BOG to get your `client_id` and `client_secret`
3. These credentials are unique per business and act as username/password for authentication

## API Endpoints (BOG E-commerce API)

### Authentication
- **Endpoint**: `/api/token`
- **Method**: GET
- **Purpose**: Get BOG access token using client credentials
- **Note**: Uses OAuth2 client credentials flow

### Order Creation
- **Endpoint**: `/api/create-order`
- **Method**: POST
- **Purpose**: Create payment order with BOG
- **API**: `https://api.bog.ge/payments/v1/ecommerce/orders`

### Payment Callback
- **Endpoint**: `/api/payment-callback`
- **Method**: POST
- **Purpose**: Handle payment status updates from BOG

### Payment Status Check
- **Endpoint**: `/api/payments/status/[orderId]`
- **Method**: GET
- **Purpose**: Check payment status for a specific order
- **API**: `https://api.bog.ge/payments/v1/ecommerce/orders/{orderId}`

## API Structure (BOG E-commerce API)

### Request Body for Order Creation:
```json
{
  "callback_url": "https://example.com/callback",
  "external_order_id": "id123",
  "purchase_units": {
    "currency": "GEL",
    "total_amount": 100,
    "basket": [
      {
        "quantity": 1,
        "unit_price": 100,
        "product_id": "product123"
      }
    ]
  },
  "redirect_urls": {
    "fail": "https://example.com/fail",
    "success": "https://example.com/success"
  }
}
```

### Response Structure:
```json
{
  "order_id": "ORDER_ID",
  "links": [
    {
      "rel": "approve",
      "href": "https://payment.bog.ge/checkout/ORDER_ID",
      "method": "GET"
    }
  ]
}
```

## Callback URL Configuration

Make sure your callback URL is configured in BOG:
```
https://www.kipianistore.ge/api/payment-callback
```

## Testing

1. Set up environment variables
2. Test token generation: `GET /api/token`
3. Test order creation with cart data
4. Test callback verification with BOG's test environment

## Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- Verify callback signatures using the provided public key
- Implement proper error handling and logging

## Example cURL Request

```bash
curl -X POST 'https://api.bog.ge/payments/v1/ecommerce/orders' \
-H 'Accept-Language: ka' \
-H 'Authorization: Bearer <token>' \
-H 'Content-Type: application/json' \
--data-raw '{
    "callback_url": "https://example.com/callback",
    "external_order_id": "id123",
    "purchase_units": {
        "currency": "GEL",
        "total_amount": 1,
        "basket": [
            {
                "quantity": 1,
                "unit_price": 1,
                "product_id": "product123"
            }
        ]
    },
    "redirect_urls": {
        "fail": "https://example.com/fail",
        "success": "https://example.com/success"
    }
}'
``` 