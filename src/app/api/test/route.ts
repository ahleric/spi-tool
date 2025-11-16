import { NextRequest, NextResponse } from "next/server";
import { getArtistIdFromInput, getArtistById, getArtistTracksAll } from "@/lib/spotify";
import { checkDebugAccess } from "@/lib/debug-auth";

export async function GET(req: NextRequest) {
  const authError = checkDebugAccess(req);
  if (authError) return authError;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  try {
    const artistIdRaw = await getArtistIdFromInput(q);
    const artistId =
      typeof artistIdRaw === "string"
        ? artistIdRaw
        : (artistIdRaw as any)?.id || (artistIdRaw as any)?.artistId || "";

    if (!artistId || artistId.length < 10)
      return NextResponse.json(
        { error: "Invalid artistId", artistIdRaw },
        { status: 400 },
      );

    const artist = await getArtistById(artistId);
    const tracks = await getArtistTracksAll(artistId);

    return NextResponse.json({
      artist,
      tracksCount: tracks.length,
      topTracks: tracks.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data || err?.message || "Unknown error", stack: err?.stack },
      { status: 500 },
    );
  }
}
