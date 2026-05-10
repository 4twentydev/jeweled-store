import sharp from "sharp"

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024
export const IMAGE_UPLOAD_MAX_DIMENSION = 8000
export const DEFAULT_IMAGE_OUTPUT_DIMENSION = 1600

export const IMAGE_MIME_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
} as const

export const DEFAULT_ALLOWED_IMAGE_MIME_TYPES = new Set(Object.values(IMAGE_MIME_TYPES))

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024)
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
}

function matchesMagicBytes(buf: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case IMAGE_MIME_TYPES.jpeg:
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    case IMAGE_MIME_TYPES.png:
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      )
    case IMAGE_MIME_TYPES.webp:
      return (
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      )
    case IMAGE_MIME_TYPES.gif:
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
    case IMAGE_MIME_TYPES.avif:
      return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70
    default:
      return false
  }
}

export async function normalizeImageUpload(
  file: File,
  {
    allowedMimeTypes = DEFAULT_ALLOWED_IMAGE_MIME_TYPES,
    maxBytes = IMAGE_UPLOAD_MAX_BYTES,
    maxDimension = IMAGE_UPLOAD_MAX_DIMENSION,
    outputDimension = DEFAULT_IMAGE_OUTPUT_DIMENSION,
    outputQuality,
    typeErrorMessage = "File type not allowed",
  }: {
    allowedMimeTypes?: ReadonlySet<string>
    maxBytes?: number
    maxDimension?: number
    outputDimension?: number
    outputQuality: number
    typeErrorMessage?: string
  }
): Promise<Buffer> {
  if (file.size > maxBytes) {
    throw new ImageUploadError(`File exceeds ${formatBytes(maxBytes)} limit`, 413)
  }

  const declaredMime = file.type.toLowerCase().split(";")[0].trim()
  if (!allowedMimeTypes.has(declaredMime)) {
    throw new ImageUploadError(typeErrorMessage, 415)
  }

  let arrayBuf: ArrayBuffer
  try {
    arrayBuf = await file.arrayBuffer()
  } catch {
    throw new ImageUploadError("File could not be read", 400)
  }

  const buf = new Uint8Array(arrayBuf)
  if (!matchesMagicBytes(buf, declaredMime)) {
    throw new ImageUploadError("File content does not match declared type", 415)
  }

  let metadata: sharp.Metadata
  try {
    metadata = await sharp(Buffer.from(arrayBuf), { animated: false }).metadata()
  } catch {
    throw new ImageUploadError("File could not be decoded as an image", 415)
  }

  const { width = 0, height = 0 } = metadata
  if (width > maxDimension || height > maxDimension) {
    throw new ImageUploadError(`Image dimensions must not exceed ${maxDimension}px`, 422)
  }

  try {
    return await sharp(Buffer.from(arrayBuf), { animated: false })
      .rotate()
      .resize({
        width: outputDimension,
        height: outputDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: outputQuality })
      .toBuffer()
  } catch {
    throw new ImageUploadError("Image optimization failed", 422)
  }
}
