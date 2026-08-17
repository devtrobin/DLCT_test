-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CancellationCause" AS ENUM ('CLIENT', 'PROFESSIONAL', 'SCHEDULE_CHANGED', 'UNAVAILABILITY', 'ACCOUNT_DELETED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AppointmentParty" AS ENUM ('CLIENT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "HistoryActorType" AS ENUM ('CLIENT_USER', 'PROFESSIONAL_USER', 'PUBLIC_CLIENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HistoryEventType" AS ENUM ('APPOINTMENT_CREATED', 'MANUAL_APPOINTMENT_CREATED', 'APPOINTMENT_CANCELED', 'CHANGE_PROPOSED', 'CHANGE_ACCEPTED', 'CHANGE_REJECTED', 'CHANGE_CANCELED', 'CHANGE_FORCED', 'CHANGE_CONFLICT', 'SCHEDULE_CANCELLATION', 'UNAVAILABILITY_CANCELLATION', 'ACCOUNT_DELETION_CANCELLATION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_CREATED', 'MANUAL_APPOINTMENT_CREATED', 'APPOINTMENT_CANCELED', 'CHANGE_PROPOSED', 'CHANGE_ACCEPTED', 'CHANGE_REJECTED', 'CHANGE_CANCELED', 'CHANGE_FORCED', 'CHANGE_CONFLICT', 'SCHEDULE_CANCELLATION', 'UNAVAILABILITY_CANCELLATION', 'ACCOUNT_DELETION_CANCELLATION');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "professionalUserId" INTEGER,
    "clientUserId" INTEGER,
    "publicCode" VARCHAR(64),
    "clientFirstName" VARCHAR(100),
    "clientLastName" VARCHAR(100),
    "clientPhone" VARCHAR(30),
    "clientEmail" VARCHAR(254),
    "clientAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "professionalBusinessName" VARCHAR(150),
    "professionalAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "professionalTimezone" VARCHAR(64) NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancellationCause" "CancellationCause",
    "cancellationReason" VARCHAR(500),
    "canceledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyAvailability" (
    "id" SERIAL NOT NULL,
    "professionalUserId" INTEGER NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "startMinute" SMALLINT NOT NULL,
    "endMinute" SMALLINT NOT NULL,

    CONSTRAINT "WeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unavailability" (
    "id" SERIAL NOT NULL,
    "professionalUserId" INTEGER NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentHistory" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "eventType" "HistoryEventType" NOT NULL,
    "actorUserId" INTEGER,
    "actorType" "HistoryActorType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" SERIAL NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "eventKey" VARCHAR(128) NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentChangeProposal" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "authorParty" "AppointmentParty" NOT NULL,
    "recipientParty" "AppointmentParty" NOT NULL,
    "authorUserId" INTEGER,
    "recipientUserId" INTEGER,
    "proposedStartAt" TIMESTAMPTZ(3) NOT NULL,
    "proposedEndAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "userId" INTEGER NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "preferredTimezone" VARCHAR(64) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ProfessionalProfile" (
    "userId" INTEGER NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "businessName" VARCHAR(150) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "calendarVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" VARCHAR(64) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_professionalUserId_startAt_idx" ON "Appointment"("professionalUserId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_clientUserId_startAt_idx" ON "Appointment"("clientUserId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_public_code_unique" ON "Appointment"("publicCode");

-- CreateIndex
CREATE INDEX "WeeklyAvailability_professionalUserId_weekday_idx" ON "WeeklyAvailability"("professionalUserId", "weekday");

-- CreateIndex
CREATE INDEX "Unavailability_professionalUserId_startAt_idx" ON "Unavailability"("professionalUserId", "startAt");

-- CreateIndex
CREATE INDEX "AppointmentHistory_appointmentId_createdAt_id_idx" ON "AppointmentHistory"("appointmentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientUserId_readAt_createdAt_id_idx" ON "InAppNotification"("recipientUserId", "readAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientUserId_createdAt_id_idx" ON "InAppNotification"("recipientUserId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipient_event_unique" ON "InAppNotification"("recipientUserId", "eventKey");

-- CreateIndex
CREATE INDEX "AppointmentChangeProposal_appointmentId_createdAt_idx" ON "AppointmentChangeProposal"("appointmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_email_unique" ON "User"("role", "email");

-- CreateIndex
CREATE UNIQUE INDEX "professional_business_name_unique" ON "ProfessionalProfile"("businessName");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "ProfessionalProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "ClientProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT "WeeklyAvailability_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChangeProposal" ADD CONSTRAINT "AppointmentChangeProposal_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChangeProposal" ADD CONSTRAINT "AppointmentChangeProposal_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChangeProposal" ADD CONSTRAINT "AppointmentChangeProposal_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProfile" ADD CONSTRAINT "ProfessionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
