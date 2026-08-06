import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----
`.trim()

export async function POST(req: NextRequest) {
  const signature = req.headers.get("callback-signature")
  const rawBody = await req.text()

  try {
    // Validate signature
    const verify = crypto.createVerify("RSA-SHA256")
    verify.update(rawBody)
    verify.end()

    const isValid = verify.verify(PUBLIC_KEY, signature!, "base64")

    if (!isValid) {
      console.error("❌ Callback verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const data = JSON.parse(rawBody)


    // Extract payment information
    const { event, body } = data
    const { order_id, external_order_id, status, amount } = body

    if (event === 'order_payment') {
      // Find the order in your database
      const order = await prisma.order.findFirst({
        where: { 
          id: external_order_id 
        }
      })

      if (!order) {
        console.error(`❌ Order not found: ${external_order_id}`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Update order status based on payment status
      let isPaid = false

      switch (status) {
        case 'APPROVED':
        case 'COMPLETED':
          isPaid = true
          break
        case 'DECLINED':
        case 'FAILED':
        case 'CANCELLED':
          isPaid = false
          break
        default:
          isPaid = false
      }

      // Update the order in database
      await prisma.order.update({
        where: { id: external_order_id },
        data: {
          isPaid,
          paidAt: isPaid ? new Date() : null,
          paymentResult: {
            bogOrderId: order_id,
            status: status,
            amount: amount,
            processedAt: new Date().toISOString()
          }
        }
      })


    }

    return new NextResponse("OK", { status: 200 })
  } catch (err) {
    console.error("❌ Callback handler error", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
