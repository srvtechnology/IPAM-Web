import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const alumniSession = await getAlumniSession(req);
  const adminSession = await getAdminSession(req);

  if (!alumniSession && !adminSession) {
    return fail(401, "Authentication required to upload files");
  }

  const contentType = req.headers.get("content-type") || "";

  let fileBuffer: Buffer;
  let originalFilename = "upload";
  let mimeType = "application/octet-stream";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return fail(400, "Missing 'file' field in multipart form data");
      }

      if (file.size > MAX_FILE_SIZE) {
        return fail(400, "File size exceeds the 10MB limit");
      }

      mimeType = file.type || "application/octet-stream";
      originalFilename = (file as File).name || "upload";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (!body || !body.file) {
        return fail(400, "Invalid JSON body. Expected 'file' (base64 or data URL) and optional 'filename'");
      }

      originalFilename = body.filename || "upload";
      const rawData = body.file as string;

      if (rawData.startsWith("data:")) {
        const matches = rawData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], "base64");
        } else {
          return fail(400, "Invalid data URL format");
        }
      } else {
        fileBuffer = Buffer.from(rawData, "base64");
        mimeType = body.mimeType || "application/octet-stream";
      }

      if (fileBuffer.length > MAX_FILE_SIZE) {
        return fail(400, "File size exceeds the 10MB limit");
      }
    } else {
      return fail(400, "Unsupported Content-Type. Use multipart/form-data or application/json");
    }

    if (mimeType !== "application/octet-stream" && !ALLOWED_MIME_TYPES.has(mimeType)) {
      return fail(400, `File type '${mimeType}' is not allowed. Supported formats: images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX)`);
    }

    // Determine extension
    const ext = path.extname(originalFilename) || (mimeType.includes("pdf") ? ".pdf" : ".jpg");
    const safeBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const targetFilename = `${safeBase}_${uniqueSuffix}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, targetFilename);
    await fs.writeFile(filePath, fileBuffer);

    const publicUrl = `/uploads/${targetFilename}`;

    return ok(
      {
        url: publicUrl,
        filename: targetFilename,
        originalName: originalFilename,
        mimeType,
        size: fileBuffer.length,
      },
      201
    );
  } catch (error) {
    console.error("Upload error:", error);
    return fail(500, "Failed to process and store uploaded file");
  }
}
