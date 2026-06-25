-- AlterTable
ALTER TABLE "entries" ADD COLUMN "status" TEXT DEFAULT 'unknown';
ALTER TABLE "entries" ADD COLUMN "statusCheckedAt" DATETIME;
