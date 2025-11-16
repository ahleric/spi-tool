-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistPopularitySnapshot" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistPopularitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackPopularitySnapshot" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackPopularitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "artistId" TEXT,
    "artistName" TEXT,
    "trackId" TEXT,
    "trackName" TEXT,
    "input" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistPopularitySnapshot_artistId_takenAt_idx" ON "ArtistPopularitySnapshot"("artistId", "takenAt");

-- CreateIndex
CREATE INDEX "TrackPopularitySnapshot_trackId_takenAt_idx" ON "TrackPopularitySnapshot"("trackId", "takenAt");

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE INDEX "EventLog_artistId_idx" ON "EventLog"("artistId");

-- CreateIndex
CREATE INDEX "EventLog_trackId_idx" ON "EventLog"("trackId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPopularitySnapshot" ADD CONSTRAINT "ArtistPopularitySnapshot_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackPopularitySnapshot" ADD CONSTRAINT "TrackPopularitySnapshot_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
