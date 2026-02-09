import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Strict filename validation: alphanumeric, dash, dot, underscore only
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Unsupported file type", { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
