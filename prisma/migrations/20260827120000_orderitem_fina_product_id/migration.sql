-- Allow FINA catalog ids (numeric strings) on order items.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" TYPE TEXT;
