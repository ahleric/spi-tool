ALTER TABLE "ArtistPopularitySnapshot"
ADD COLUMN "snapshotDay" TIMESTAMP(3);

ALTER TABLE "TrackPopularitySnapshot"
ADD COLUMN "snapshotDay" TIMESTAMP(3);

UPDATE "ArtistPopularitySnapshot"
SET "snapshotDay" = date_trunc('day', "takenAt")
WHERE "snapshotDay" IS NULL;

UPDATE "TrackPopularitySnapshot"
SET "snapshotDay" = date_trunc('day', "takenAt")
WHERE "snapshotDay" IS NULL;

DELETE FROM "ArtistPopularitySnapshot" AS target
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "artistId", "snapshotDay"
        ORDER BY "takenAt" DESC, id DESC
      ) AS row_num
    FROM "ArtistPopularitySnapshot"
  ) ranked
  WHERE ranked.row_num > 1
) AS duplicates
WHERE target.id = duplicates.id;

DELETE FROM "TrackPopularitySnapshot" AS target
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "trackId", "snapshotDay"
        ORDER BY "takenAt" DESC, id DESC
      ) AS row_num
    FROM "TrackPopularitySnapshot"
  ) ranked
  WHERE ranked.row_num > 1
) AS duplicates
WHERE target.id = duplicates.id;

ALTER TABLE "ArtistPopularitySnapshot"
ALTER COLUMN "snapshotDay" SET NOT NULL;

ALTER TABLE "TrackPopularitySnapshot"
ALTER COLUMN "snapshotDay" SET NOT NULL;

CREATE UNIQUE INDEX "ArtistPopularitySnapshot_artistId_snapshotDay_key"
ON "ArtistPopularitySnapshot"("artistId", "snapshotDay");

CREATE UNIQUE INDEX "TrackPopularitySnapshot_trackId_snapshotDay_key"
ON "TrackPopularitySnapshot"("trackId", "snapshotDay");
