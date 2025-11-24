-- CreateEnum
CREATE TYPE "PhoneType" AS ENUM ('WHATSAPP', 'MOBILE', 'HOME', 'WORK');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('REGISTERED', 'IDENTIFIED_NO_LOGIN', 'WALKIN_NAME_ONLY');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('INTERNAL', 'CUSTOMER_PORTAL', 'WHATSAPP', 'INTEGRATION');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'WALKIN_NAME_ONLY',
ADD COLUMN     "source" "AppointmentSource" NOT NULL DEFAULT 'INTERNAL',
ALTER COLUMN "customerPhone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filialId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "document" TEXT,
    "documentType" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPhone" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "PhoneType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_email_idx" ON "Customer"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_document_key" ON "Customer"("tenantId", "document");

-- CreateIndex
CREATE INDEX "CustomerPhone_phone_idx" ON "CustomerPhone"("phone");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_customerId_idx" ON "Appointment"("tenantId", "customerId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPhone" ADD CONSTRAINT "CustomerPhone_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

