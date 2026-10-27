-- Référentiel géographique + migration Association.region (enum) -> regionId (FK)

CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

CREATE TABLE "departements" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "departementId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departements_regionId_name_key" ON "departements"("regionId", "name");
CREATE INDEX "departements_regionId_idx" ON "departements"("regionId");

CREATE UNIQUE INDEX "communes_departementId_name_key" ON "communes"("departementId", "name");
CREATE INDEX "communes_departementId_idx" ON "communes"("departementId");

ALTER TABLE "departements" ADD CONSTRAINT "departements_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "communes" ADD CONSTRAINT "communes_departementId_fkey"
    FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Association" ADD COLUMN "regionId" TEXT,
ADD COLUMN "departementId" TEXT,
ADD COLUMN "communeId" TEXT;

INSERT INTO "regions" ("id", "code", "name", "createdAt", "updatedAt", "isDeleted") VALUES
('geo_reg_niamey', 'NIAMEY', 'Niamey', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_zinder', 'ZINDER', 'Zinder', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_maradi', 'MARADI', 'Maradi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_tahoua', 'TAHOUA', 'Tahoua', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_agadez', 'AGADEZ', 'Agadez', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_diffa', 'DIFFA', 'Diffa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_tillaberi', 'TILLABERI', 'Tillabéri', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('geo_reg_dosso', 'DOSSO', 'Dosso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

INSERT INTO "departements" ("id", "regionId", "code", "name", "createdAt", "updatedAt", "isDeleted")
SELECT 'geo_dept_' || r."id", r."id", NULL, 'Non renseigné', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false FROM "regions" r;

INSERT INTO "communes" ("id", "departementId", "code", "name", "createdAt", "updatedAt", "isDeleted")
SELECT 'geo_comm_' || d."id", d."id", NULL, 'Non renseigné', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false FROM "departements" d;

UPDATE "Association" a SET "regionId" = r."id" FROM "regions" r WHERE r."code" = a."region"::text;

UPDATE "Association" a SET "departementId" = d."id" FROM "departements" d WHERE d."regionId" = a."regionId" AND d."name" = 'Non renseigné';

UPDATE "Association" a SET "communeId" = c."id" FROM "communes" c WHERE c."departementId" = a."departementId" AND c."name" = 'Non renseigné';

ALTER TABLE "Association" DROP COLUMN "region",
DROP COLUMN "department",
DROP COLUMN "commune";

ALTER TABLE "Association" ALTER COLUMN "regionId" SET NOT NULL;

DROP TYPE IF EXISTS "Region";

ALTER TABLE "Association" ADD CONSTRAINT "Association_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Association" ADD CONSTRAINT "Association_departementId_fkey"
    FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Association" ADD CONSTRAINT "Association_communeId_fkey"
    FOREIGN KEY ("communeId") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
