-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "followers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "genres" TEXT[],
ADD COLUMN     "popularity" INTEGER,
ADD COLUMN     "spi" DOUBLE PRECISION,
ADD COLUMN     "spotifyUrl" TEXT;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "album" TEXT,
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "popularity" INTEGER,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "spi" DOUBLE PRECISION,
ADD COLUMN     "spotifyUrl" TEXT;

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
