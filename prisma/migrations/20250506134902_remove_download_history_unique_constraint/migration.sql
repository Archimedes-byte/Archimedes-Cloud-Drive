/*
  Warnings:

  - You are about to drop the column `displayName` on the `UserProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DownloadHistory_userId_fileId_key";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storagePath" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "displayName",
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "FileAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileAccess_userId_idx" ON "FileAccess"("userId");

-- CreateIndex
CREATE INDEX "FileAccess_fileId_idx" ON "FileAccess"("fileId");

-- CreateIndex
CREATE INDEX "FileAccess_accessedAt_idx" ON "FileAccess"("accessedAt");

-- AddForeignKey
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
