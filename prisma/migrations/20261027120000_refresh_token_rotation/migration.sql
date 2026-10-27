-- Rotation des refresh tokens : token précédent conservé brièvement (requêtes parallèles)
-- et détection de réutilisation (vol de token).
ALTER TABLE "Session" ADD COLUMN "previousRefreshToken" TEXT,
ADD COLUMN "refreshTokenRotatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Session_previousRefreshToken_idx" ON "Session"("previousRefreshToken");
