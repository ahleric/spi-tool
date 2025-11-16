// src/app/api/debug/steps/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { checkDebugAccess } from "@/lib/debug-auth";

const ID = process.env.SPOTIFY_CLIENT_ID!;
const SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

async function getToken() {
  const auth = Buffer.from(`${ID}:${SECRET}`).toString("base64");
  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res.data.access_token as string;
}

export async function GET(req: NextRequest) {
  const authError = checkDebugAccess(req);
  if (authError) return authError;
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("q") || "taylor swift";
  try {
    const token = await getToken();
    const h = { Authorization: `Bearer ${token}` };

    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: h,
      params: { q: input, type: "artist", limit: 1, market: "US" },
    });
    const first = searchRes.data?.artists?.items?.[0];
    if (!first) {
      return NextResponse.json(
        { step: "search", ok: false, data: searchRes.data },
        { status: 400 },
      );
    }
    const artistId = first.id as string;

    const artistRes = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { headers: h },
    );

    const albumsRes = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/albums`,
      { headers: h, params: { include_groups: "album,single", limit: 10, market: "US" } },
    );
    const albums = albumsRes.data?.items ?? [];
    const firstAlbum = albums[0];

    let tracksOfFirstAlbum: any[] = [];
    if (firstAlbum) {
      const tracksRes = await axios.get(
        `https://api.spotify.com/v1/albums/${firstAlbum.id}/tracks`,
        { headers: h, params: { limit: 50, market: "US" } },
      );
      tracksOfFirstAlbum = tracksRes.data?.items ?? [];
    }

    let batchTracksRes: any = null;
    const ids = tracksOfFirstAlbum
      .map((t: any) => t.id)
      .filter(Boolean)
      .slice(0, 50);
    if (ids.length > 0) {
      batchTracksRes = await axios.get(`https://api.spotify.com/v1/tracks`, {
        headers: h,
        params: { ids: ids.join(","), market: "US" },
      });
    }

    return NextResponse.json({
      ok: true,
      input,
      artistId,
      artistPopularity: artistRes.data?.popularity,
      albumsCount: albums.length,
      firstAlbumName: firstAlbum?.name ?? null,
      firstAlbumTracksCount: tracksOfFirstAlbum.length,
      batchTracksReturned: batchTracksRes?.data?.tracks?.length ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        status: err?.response?.status || null,
        where: err?.config?.url || "unknown",
        params: err?.config?.params || null,
        data: err?.response?.data || err?.message || "unknown",
      },
      { status: 500 },
    );
  }
}

