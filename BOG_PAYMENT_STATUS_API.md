# BOG Payment Status API Documentation

## Get Order Payment Status (支払い状況取得)

**Endpoint:** `GET /api/orders/bog-status/{orderId}`

**Description:** This API endpoint checks the payment status of an order processed through BOG (Bank of Georgia) payment system. It retrieves real-time payment information and updates the order status in the database.

---

## Request Headers (リクエストヘッダー)

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token for user authentication |
| `Content-Type` | string | Yes | Must be `application/json` |

---

## Request Parameters (リクエストパラメータ)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | Yes | Unique identifier of the order to check |

---

## Response Format (レスポンス形式)

### Success Response (成功レスポンス)

**Status Code:** 200

```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "isPaid": true,
    "isDelivered": false,
    "paidAt": "2025-01-20T10:30:00.000Z",
    "itemsPrice": 150.00,
    "shippingPrice": 10.00,
    "taxPrice": 15.00,
    "totalPrice": 175.00,
    "paymentResult": {
      "status": "completed",
      "transactionId": "txn_456789",
      "amount": 175.00,
      "currency": "GEL",
      "method": "card",
      "cardType": "visa",
      "refunded": false,
      "failed": false,
      "update_time": "2025-01-20T10:30:00.000Z"
    }
  },
  "bogStatus": {
    "orderStatus": "completed",
    "orderStatusValue": "Completed",
    "paymentMethod": "card",
    "transactionId": "txn_456789",
    "amount": 175.00,
    "currency": "GEL",
    "buyerName": "John Doe",
    "buyerEmail": "john@example.com",
    "buyerPhone": "+995555123456"
  }
}
```

### Error Responses (エラーレスポンス)

#### Unauthorized (認証エラー)
**Status Code:** 401

```json
{
  "error": "Unauthorized"
}
```

#### Order Not Found (注文が見つかりません)
**Status Code:** 404

```json
{
  "error": "Order not found"
}
```

#### Not a BOG Order (BOG注文ではありません)
**Status Code:** 400

```json
{
  "error": "Not a BOG order",
  "orderStatus": "pending"
}
```

#### BOG Token Error (BOGトークンエラー)
**Status Code:** 500

```json
{
  "error": "Failed to get BOG token"
}
```

#### BOG API Error (BOG APIエラー)
**Status Code:** 200 (with error in response)

```json
{
  "success": true,
  "order": {
    // Order details...
  },
  "bogStatus": null,
  "error": "Failed to fetch BOG status",
  "message": "Order status may not be up to date"
}
```

#### General Error (一般エラー)
**Status Code:** 500

```json
{
  "error": "Failed to fetch order status"
}
```

---

## Payment Status Mapping (支払い状況マッピング)

### BOG Status to Order Status Mapping

| BOG Status | isPaid | isRefunded | isFailed | Description |
|------------|--------|------------|----------|-------------|
| `completed` | ✅ true | ❌ false | ❌ false | Payment completed successfully |
| `blocked` | ✅ true | ❌ false | ❌ false | Payment blocked but processed |
| `partial_completed` | ✅ true | ❌ false | ❌ false | Partial payment completed |
| `processing` | ✅ true | ❌ false | ❌ false | Payment is being processed |
| `refunded` | ✅ true | ✅ true | ❌ false | Payment has been refunded |
| `refunded_partially` | ✅ true | ✅ true | ❌ false | Partial refund processed |
| `rejected` | ❌ false | ❌ false | ✅ true | Payment was rejected |
| `created` | ❌ false | ❌ false | ❌ false | Order created, payment pending |
| `auth_requested` | ❌ false | ❌ false | ❌ false | Authorization requested |

---

## BOG API Integration (BOG API統合)

### External API Calls

The endpoint makes the following calls to BOG's API:

1. **Get Order Status**
   - Endpoint: `GET https://api.bog.ge/payments/v1/ecommerce/orders/{orderId}`
   - Purpose: Retrieve current order status and payment details

2. **Get Receipt**
   - Endpoint: `GET https://api.bog.ge/payments/v1/receipt/{orderId}`
   - Purpose: Retrieve payment receipt information (optional)

### Authentication

BOG API calls are authenticated using a Bearer token obtained from the `/api/token` endpoint.

---

## Database Updates (データベース更新)

When a successful BOG status check is performed, the following order fields are updated:

- `isPaid`: Boolean indicating payment status
- `paidAt`: Timestamp when payment was confirmed
- `paymentResult`: JSON object containing detailed payment information
  - `status`: BOG order status
  - `transactionId`: BOG transaction identifier
  - `amount`: Payment amount
  - `currency`: Payment currency
  - `method`: Payment method used
  - `cardType`: Type of card used (if applicable)
  - `refunded`: Refund status
  - `failed`: Failure status
  - `update_time`: Last update timestamp

---

## Error Codes (エラーコード)

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| 1000 | Invalid Request | 400 |
| 1001 | Unauthorized | 401 |
| 2000 | Order Not Found | 404 |
| 3000 | Not a BOG Order | 400 |
| 4000 | BOG Token Error | 500 |
| 5000 | BOG API Error | 200* |
| 99999 | Internal Server Error | 500 |

*Note: BOG API errors return HTTP 200 with error details in the response body

---

## Usage Examples (使用例)

### Check Payment Status

```bash
curl -X GET \
  "https://yourdomain.com/api/orders/bog-status/order_123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript Example

```typescript
const checkPaymentStatus = async (orderId: string, token: string) => {
  const response = await fetch(`/api/orders/bog-status/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Payment Status:', data.order.isPaid ? 'Paid' : 'Pending');
    console.log('BOG Status:', data.bogStatus?.orderStatus);
  } else {
    console.error('Error:', data.error);
  }
};
```

---

## Rate Limiting (レート制限)

- **Requests per minute:** 60
- **Requests per hour:** 1000
- **Requests per day:** 10000

---

## Notes (注意事項)

1. **BOG Orders Only**: This endpoint only works with orders that use BOG as the payment method
2. **Real-time Updates**: The endpoint fetches live data from BOG's API and updates the local database
3. **Fallback Handling**: If BOG API is unavailable, the endpoint returns cached order status
4. **Authentication Required**: User must be authenticated and own the order being checked
5. **Currency**: All amounts are returned in GEL (Georgian Lari)

---

## Support (サポート)

For technical support or questions about this API endpoint, please contact:

- **Email**: support@yourcompany.com
- **Documentation**: https://docs.yourcompany.com
- **API Status**: https://status.yourcompany.com

---

*Copyright © 2025 [Company Name] All Rights Reserved.*
