-- AlterTable
ALTER TABLE "AdminDocument" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'admin_upload',
ADD COLUMN     "uploadedByAlumniId" INTEGER,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" INTEGER,
ALTER COLUMN "uploadedBy" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AdminDocument_alumniId_idx" ON "AdminDocument"("alumniId");

-- CreateIndex
CREATE INDEX "AdminDocument_documentType_idx" ON "AdminDocument"("documentType");

-- CreateIndex
CREATE INDEX "AdminDocument_verificationStatus_idx" ON "AdminDocument"("verificationStatus");

-- CreateIndex
CREATE INDEX "AdminDocument_source_idx" ON "AdminDocument"("source");
