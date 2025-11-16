import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  getArtistIdFromInput,
  getArtistById,
  getArtistTracksAll,
} from "@/lib/spotify";
import { checkDebugAccess } from "@/lib/debug-auth";

export async function GET(req: NextRequest) {
  const authError = checkDebugAccess(req);
  if (authError) return authError;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "taylor swift";
  const out: any = { input: q };

  try {
    const idAny = await getArtistIdFromInput(q);
    const id = typeof idAny === "string" ? idAny : (idAny as any).id;
    out.stepA = { ok: true, artistId: id };
  } catch (err: any) {
    return NextResponse.json(
      {
        ...out,
        stepA: {
          ok: false,
          status: err?.response?.status || null,
          data: err?.response?.data || err?.message || "unknown",
        },
      },
      { status: 500 },
    );
  }

  try {
    const artist = await getArtistById(out.stepA.artistId);
    out.stepB = { ok: true, artistPopularity: artist.popularity };
  } catch (err: any) {
    return NextResponse.json(
      {
        ...out,
        stepB: {
          ok: false,
          where: err?.config?.url || "unknown",
          status: err?.response?.status || null,
          data: err?.response?.data || err?.message || "unknown",
        },
      },
      { status: 500 },
    );
  }

  try {
    const tracks = await getArtistTracksAll(out.stepA.artistId);
    out.stepC = {
      ok: true,
      tracksCount: tracks.length,
      top3: tracks.slice(0, 3),
    };
  } catch (err: any) {
    return NextResponse.json(
      {
        ...out,
        stepC: {
          ok: false,
          where: err?.config?.url || "unknown",
          status: err?.response?.status || null,
          data: err?.response?.data || err?.message || "unknown",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json(out);
}

