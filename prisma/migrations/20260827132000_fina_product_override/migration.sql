CREATE TABLE IF NOT EXISTS "FinaProductOverride" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "finaId" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT,
    "titleEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "brand" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "FinaProductOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinaProductOverride_finaId_key" ON "FinaProductOverride"("finaId");
