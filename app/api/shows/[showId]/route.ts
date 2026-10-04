import { NextRequest, NextResponse } from "next/server";
import { getServerState, setServerState } from "@/lib/serverLiveStore";
import { ServerLiveState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { showId: string } }
) {
  return NextResponse.json(getServerState(params.showId));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { showId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const patch: Partial<Omit<ServerLiveState, "updatedAt">> = {
    show: body.show ?? undefined,
    slideIndex: typeof body.slideIndex === "number" ? body.slideIndex : undefined,
    blackout: typeof body.blackout === "boolean" ? body.blackout : undefined,
  };
  const next = setServerState(params.showId, patch);
  return NextResponse.json(next);
}
