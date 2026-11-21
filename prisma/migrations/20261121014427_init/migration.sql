-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'OFICINA', 'SEGURADORA');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CARRO', 'MOTO');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('COLISAO', 'FURTO', 'ROUBO', 'INCENDIO', 'ALAGAMENTO', 'VIDROS', 'OUTRO');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('ABERTO', 'EM_ANALISE', 'NEGADO', 'ENCAMINHADO_OFICINA', 'INDENIZACAO_INTEGRAL', 'AGUARDANDO_ORCAMENTO', 'ORCAMENTO_ENVIADO', 'AJUSTE_SOLICITADO', 'ORCAMENTO_APROVADO', 'EM_REPARO', 'PRONTO_PARA_RETIRADA', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LEVE', 'MEDIO', 'GRAVE');

-- CreateEnum
CREATE TYPE "DamageSource" AS ENUM ('CLIENTE', 'OFICINA');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'AJUSTE_SOLICITADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "RepairAction" AS ENUM ('TROCAR', 'REPARAR', 'PINTAR');

-- CreateEnum
CREATE TYPE "Coverage" AS ENUM ('PENDENTE', 'COBERTO', 'NAO_COBERTO');

-- CreateEnum
CREATE TYPE "ClaimEventType" AS ENUM ('CRIACAO', 'STATUS', 'MENSAGEM', 'ORCAMENTO', 'COBERTURA', 'ANEXO');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('FOTO', 'DOCUMENTO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "deductible" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolSequence" (
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProtocolSequence_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workshopId" TEXT,
    "adjusterId" TEXT,
    "type" "ClaimType" NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDamage" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "partKey" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "note" TEXT,
    "source" "DamageSource" NOT NULL,

    CONSTRAINT "ClaimDamage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'RASCUNHO',
    "laborTotal" INTEGER NOT NULL DEFAULT 0,
    "partsTotal" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "partKey" TEXT NOT NULL,
    "action" "RepairAction" NOT NULL,
    "partPrice" INTEGER NOT NULL DEFAULT 0,
    "laborPrice" INTEGER NOT NULL DEFAULT 0,
    "coverage" "Coverage" NOT NULL DEFAULT 'PENDENTE',
    "insurerNote" TEXT,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "ClaimEventType" NOT NULL,
    "fromStatus" "ClaimStatus",
    "toStatus" "ClaimStatus",
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_number_key" ON "Policy"("number");

-- CreateIndex
CREATE INDEX "Policy_vehicleId_idx" ON "Policy"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_protocol_key" ON "Claim"("protocol");

-- CreateIndex
CREATE INDEX "Claim_clientId_idx" ON "Claim"("clientId");

-- CreateIndex
CREATE INDEX "Claim_workshopId_idx" ON "Claim"("workshopId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "ClaimDamage_claimId_idx" ON "ClaimDamage"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimDamage_claimId_partKey_source_key" ON "ClaimDamage"("claimId", "partKey", "source");

-- CreateIndex
CREATE INDEX "Quote_claimId_idx" ON "Quote"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_claimId_version_key" ON "Quote"("claimId", "version");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_quoteId_partKey_key" ON "QuoteItem"("quoteId", "partKey");

-- CreateIndex
CREATE INDEX "ClaimEvent_claimId_createdAt_idx" ON "ClaimEvent"("claimId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_claimId_idx" ON "Attachment"("claimId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_adjusterId_fkey" FOREIGN KEY ("adjusterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDamage" ADD CONSTRAINT "ClaimDamage_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvent" ADD CONSTRAINT "ClaimEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvent" ADD CONSTRAINT "ClaimEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
