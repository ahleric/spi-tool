import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toDate(v?: string | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const where: any = {};
  const type = searchParams.get("type") || undefined;
  const artist = searchParams.get("artist") || undefined;
  const track = searchParams.get("track") || undefined;
  const from = toDate(searchParams.get("from"));
  const to = toDate(searchParams.get("to"));

  if (type) where.type = type;
  if (artist) where.artistId = artist;
  if (track) where.trackId = track;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const rows = await prisma.eventLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000 });

  const header = [
    "id","type","artistId","artistName","trackId","trackName","input","ip","userAgent","createdAt"
  ];
  const csv = [header.join(",")]
    .concat(
      rows.map(r => [
        r.id,
        r.type,
        r.artistId ?? "",
        (r.artistName ?? "").replaceAll('"','""'),
        r.trackId ?? "",
        (r.trackName ?? "").replaceAll('"','""'),
        (r.input ?? "").replaceAll('"','""'),
        r.ip ?? "",
        (r.userAgent ?? "").replaceAll('"','""'),
        r.createdAt.toISOString(),
      ].map(v => /[",\n]/.test(String(v)) ? `"${String(v)}"` : String(v)).join(","))
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=events_export_${Date.now()}.csv`,
    },
  });
}

