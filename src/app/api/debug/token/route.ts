// src/app/api/debug/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { checkDebugAccess } from "@/lib/debug-auth";

export async function GET(request: NextRequest) {
  const authError = checkDebugAccess(request);
  if (authError) return authError;
  try {
    const id = process.env.SPOTIFY_CLIENT_ID || "";
    const secret = process.env.SPOTIFY_CLIENT_SECRET || "";
    const auth = Buffer.from(`${id}:${secret}`).toString("base64");

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

    return NextResponse.json({
      ok: true,
      tokenType: res.data.token_type,
      expiresIn: res.data.expires_in,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        status: err?.response?.status || null,
        error: err?.response?.data || err?.message || "unknown",
        hasId: !!process.env.SPOTIFY_CLIENT_ID,
        hasSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      },
      { status: 500 },
    );
  }
}

