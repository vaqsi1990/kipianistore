-- Cart + orders for FINA catalog ids (regular customers).
-- OrderItem.productId is TEXT so FINA numeric ids can be stored.

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'CREATED',
    'PROCESSING',
    'COMPLETED',
    'PARTIAL_COMPLETED',
    'BLOCKED',
    'REJECTED',
    'REFUNDED',
    'REFUNDED_PARTIALLY',
    'AUTH_REQUESTED',
    'INVALID',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" JSON;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Cart" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "sessionCartId" TEXT NOT NULL,
  "items" JSON[] DEFAULT ARRAY[]::JSON[],
  "itemsPrice" DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  "shippingPrice" DECIMAL(12,2) NOT NULL,
  "taxPrice" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "shippingAddress" JSON NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "paymentResult" JSON,
  "paymentStatus" "PaymentStatus",
  "bogOrderId" VARCHAR(36),
  "externalOrderId" VARCHAR(36),
  "itemsPrice" DECIMAL(12,2) NOT NULL,
  "shippingPrice" DECIMAL(12,2) NOT NULL,
  "taxPrice" DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(6),
  "isDelivered" BOOLEAN NOT NULL DEFAULT false,
  "deliveredAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveryLocation" TEXT,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "orderId" UUID NOT NULL,
  "productId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "title" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  CONSTRAINT "orderitems_orderId_productId_pk" PRIMARY KEY ("orderId", "productId")
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "bogOrderId" VARCHAR(36);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "externalOrderId" VARCHAR(36);

CREATE INDEX IF NOT EXISTS "Cart_userId_idx" ON "Cart"("userId");
CREATE INDEX IF NOT EXISTS "Cart_sessionCartId_idx" ON "Cart"("sessionCartId");
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_bogOrderId_idx" ON "Order"("bogOrderId");

DO $$ BEGIN
  ALTER TABLE "Cart"
    ADD CONSTRAINT "Cart_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Order"
    ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
