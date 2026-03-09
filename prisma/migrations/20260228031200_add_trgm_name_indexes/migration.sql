-- Improve ILIKE/contains lookups used by search/suggest flows
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_artist_name_trgm
  ON "Artist"
  USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_track_name_trgm
  ON "Track"
  USING GIN ("name" gin_trgm_ops);
