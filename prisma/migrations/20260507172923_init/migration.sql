-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MEMBER', 'SUPER_ADMIN', 'MODERATOR', 'ASSOCIATION', 'CITIZEN');

-- CreateEnum
CREATE TYPE "AssociationStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NIAMEY', 'ZINDER', 'MARADI', 'TAHOUA', 'AGADEZ', 'DIFFA', 'TILLABERI', 'DOSSO');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('DECLARED', 'PUBLIC_UTILITY', 'COOPERATIVE', 'MUTUAL', 'UNION', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'WORKSHOP', 'TRAINING', 'FUNDRAISING', 'VOLUNTEERING', 'CULTURAL', 'SPORTS', 'CONFERENCE', 'CONCERT', 'FESTIVAL', 'OTHER_CULTURAL', 'OTHER_SPORTS', 'OTHER_EDUCATION', 'OTHER_ENVIRONMENT', 'OTHER_MEDICAL', 'OTHER_OTHER', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NeedType" AS ENUM ('MATERIAL', 'FINANCIAL', 'VOLUNTEER', 'SERVICE', 'SPACE', 'MEDICAL', 'EDUCATION', 'ENVIRONMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'FILLED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('STATUTES', 'RECEIPT', 'GOVERNING_BOARD', 'TAX_CLEARANCE', 'ANNUAL_REPORT', 'FINANCIAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'SUSPEND', 'REINSTATE', 'UPDATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpires" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "isImpersonation" BOOLEAN NOT NULL DEFAULT false,
    "impersonatedBy" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedLoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "device" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "ipAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isCustomizable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(255) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "slug" VARCHAR(255) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blogId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Association" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "status" "AssociationStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "slogan" TEXT,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "foundingDate" TIMESTAMP(3),
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactWhatsapp" TEXT,
    "website" TEXT,
    "facebookPage" TEXT,
    "twitterHandle" TEXT,
    "address" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Niger',
    "region" "Region" NOT NULL,
    "department" TEXT,
    "commune" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "legalStatus" "LegalStatus" NOT NULL,
    "receiptNumber" TEXT,
    "receiptFileUrl" TEXT,
    "receiptExpiryDate" TIMESTAMP(3),
    "nif" TEXT,
    "ninea" TEXT,
    "totalMembers" INTEGER,
    "totalVolunteers" INTEGER,
    "totalStaff" INTEGER,
    "annualBudget" DOUBLE PRECISION,
    "fundingSources" TEXT,
    "bankAccountName" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "statutesFileUrl" TEXT,
    "governingBoardFileUrl" TEXT,
    "taxClearanceUrl" TEXT,
    "acceptPublicContact" BOOLEAN NOT NULL DEFAULT true,
    "acceptDonations" BOOLEAN NOT NULL DEFAULT false,
    "displayMembersList" BOOLEAN NOT NULL DEFAULT false,
    "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "adminNotes" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHausa" TEXT,
    "nameZarma" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationToDomain" (
    "associationId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssociationToDomain_pkey" PRIMARY KEY ("associationId","domainId")
);

-- CreateTable
CREATE TABLE "AssociationMember" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "photoUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationEvent" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL DEFAULT 'OTHER',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "maxAttendees" INTEGER,
    "imageUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationProject" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationNeed" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "needType" "NeedType" NOT NULL DEFAULT 'MATERIAL',
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "quantity" TEXT,
    "targetAmount" DOUBLE PRECISION,
    "currentAmount" DOUBLE PRECISION DEFAULT 0,
    "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationDocument" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationVerification" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "VerificationAction" NOT NULL,
    "oldStatus" "AssociationStatus",
    "newStatus" "AssociationStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssociationVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ASSOCIATION',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "associationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenId_key" ON "VerificationToken"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenId_key" ON "PasswordResetToken"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Association_registrationNumber_key" ON "Association"("registrationNumber");

-- CreateIndex
CREATE INDEX "Association_name_idx" ON "Association"("name");

-- CreateIndex
CREATE INDEX "Association_region_idx" ON "Association"("region");

-- CreateIndex
CREATE INDEX "Association_status_idx" ON "Association"("status");

-- CreateIndex
CREATE INDEX "Association_createdAt_idx" ON "Association"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE INDEX "Domain_name_idx" ON "Domain"("name");

-- CreateIndex
CREATE INDEX "AssociationToDomain_associationId_idx" ON "AssociationToDomain"("associationId");

-- CreateIndex
CREATE INDEX "AssociationToDomain_domainId_idx" ON "AssociationToDomain"("domainId");

-- CreateIndex
CREATE INDEX "AssociationMember_associationId_idx" ON "AssociationMember"("associationId");

-- CreateIndex
CREATE INDEX "AssociationEvent_associationId_idx" ON "AssociationEvent"("associationId");

-- CreateIndex
CREATE INDEX "AssociationEvent_startDate_idx" ON "AssociationEvent"("startDate");

-- CreateIndex
CREATE INDEX "AssociationProject_associationId_idx" ON "AssociationProject"("associationId");

-- CreateIndex
CREATE INDEX "AssociationNeed_associationId_idx" ON "AssociationNeed"("associationId");

-- CreateIndex
CREATE INDEX "AssociationNeed_needType_idx" ON "AssociationNeed"("needType");

-- CreateIndex
CREATE INDEX "AssociationNeed_status_idx" ON "AssociationNeed"("status");

-- CreateIndex
CREATE INDEX "AssociationDocument_associationId_idx" ON "AssociationDocument"("associationId");

-- CreateIndex
CREATE INDEX "AssociationDocument_documentType_idx" ON "AssociationDocument"("documentType");

-- CreateIndex
CREATE INDEX "AssociationVerification_associationId_idx" ON "AssociationVerification"("associationId");

-- CreateIndex
CREATE INDEX "AssociationVerification_adminId_idx" ON "AssociationVerification"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AssociationUser_email_key" ON "AssociationUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssociationUser_associationId_key" ON "AssociationUser"("associationId");

-- CreateIndex
CREATE INDEX "AssociationUser_email_idx" ON "AssociationUser"("email");

-- CreateIndex
CREATE INDEX "ActivityLog_associationId_idx" ON "ActivityLog"("associationId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedLoginAttempt" ADD CONSTRAINT "FailedLoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Association" ADD CONSTRAINT "Association_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Association" ADD CONSTRAINT "Association_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationToDomain" ADD CONSTRAINT "AssociationToDomain_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationToDomain" ADD CONSTRAINT "AssociationToDomain_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationMember" ADD CONSTRAINT "AssociationMember_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationEvent" ADD CONSTRAINT "AssociationEvent_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationProject" ADD CONSTRAINT "AssociationProject_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationNeed" ADD CONSTRAINT "AssociationNeed_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationDocument" ADD CONSTRAINT "AssociationDocument_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationVerification" ADD CONSTRAINT "AssociationVerification_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationVerification" ADD CONSTRAINT "AssociationVerification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationUser" ADD CONSTRAINT "AssociationUser_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;
