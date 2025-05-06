-- CreateTable
CREATE TABLE "FileShareVisitor" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShareVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileShareVisitor_shareId_idx" ON "FileShareVisitor"("shareId");

-- CreateIndex
CREATE INDEX "FileShareVisitor_fingerprint_idx" ON "FileShareVisitor"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareVisitor_shareId_fingerprint_key" ON "FileShareVisitor"("shareId", "fingerprint");

-- AddForeignKey
ALTER TABLE "FileShareVisitor" ADD CONSTRAINT "FileShareVisitor_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "FileShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
