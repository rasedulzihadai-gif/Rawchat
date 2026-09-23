// Client-side image helpers for vision chat.
// Images are downscaled + JPEG-compressed in the browser so data-URLs
// stay small enough to send to providers and persist in the database.

export const MAX_IMAGES_PER_MESSAGE = 4;
export const MAX_IMAGE_DIMENSION = 1568; // longest edge, px
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const IMAGE_JPEG_QUALITY = 0.85;
// Files already under this size (and dimensions) are kept as-is.
const PASSTHROUGH_BYTES = 900 * 1024;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`"${file.name}" could not be decoded as an image.`));
      el.src = url;
    });
    // Draw to a canvas so we can treat it like a bitmap.
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1;
    canvas.height = img.naturalHeight || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");
    ctx.drawImage(img, 0, 0);
    // Wrap the canvas in an ImageBitmap-like object.
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(canvas);
    }
    // Last resort: fake bitmap via data URL round-trip.
    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return await createImageBitmap(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Downscale + compress an image file into a data-URL suitable for vision APIs. */
export async function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name || "file"}" is not an image.`);
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error(`"${file.name}" is larger than 10 MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch (e) {
    throw e instanceof Error ? e : new Error(`"${file.name}" could not be decoded.`);
  }

  try {
    const srcW = bitmap.width || 1;
    const srcH = bitmap.height || 1;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    // Small + already web-friendly: keep the original bytes.
    if (scale === 1 && file.size <= PASSTHROUGH_BYTES && PASSTHROUGH_TYPES.has(file.type)) {
      return await fileToDataUrl(file);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");
    // JPEG has no alpha channel — flatten transparency onto white.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
  } finally {
    try {
      bitmap.close();
    } catch {
      /* ignore */
    }
  }
}

/** Extract image Files from a paste event's clipboard. */
export function filesFromClipboard(e: React.ClipboardEvent): File[] {
  const out: File[] = [];
  try {
    const items = e.clipboardData?.files;
    if (!items) return out;
    for (const f of Array.from(items)) {
      if (f.type.startsWith("image/")) out.push(f);
    }
  } catch {
    /* clipboard unavailable */
  }
  return out;
}
