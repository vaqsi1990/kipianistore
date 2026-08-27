-- Order fields used by BOG payments (init created Order without these).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "bogOrderId" VARCHAR(36);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "externalOrderId" VARCHAR(36);

CREATE TABLE IF NOT EXISTS "Store" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Store_slug_key" ON "Store"("slug");
CREATE INDEX IF NOT EXISTS "Store_isActive_sortOrder_idx" ON "Store"("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "ProductStore" (
    "productId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductStore_pkey" PRIMARY KEY ("productId","storeId")
);

CREATE INDEX IF NOT EXISTS "ProductStore_storeId_idx" ON "ProductStore"("storeId");
CREATE INDEX IF NOT EXISTS "ProductStore_storeId_stock_idx" ON "ProductStore"("storeId", "stock");

DO $$ BEGIN
  ALTER TABLE "ProductStore"
    ADD CONSTRAINT "ProductStore_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductStore"
    ADD CONSTRAINT "ProductStore_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
