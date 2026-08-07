import sharp from "sharp";

// Standardizes every brand logo (manual upload or fetched favicon) to the
// same canvas size and padding, regardless of the source image's own
// dimensions/aspect ratio/transparency. flatten() removes transparency
// WITHIN the image itself (e.g. a circular mark on a transparent square,
// which is what caused "black corners" against a dark container -- the
// transparent pixels were showing the container's own background through
// them); the resize+extend steps below add the outer letterboxing/padding
// using the same color, so the final PNG is fully opaque throughout.
const CANVAS_SIZE = 256;
const CONTENT_SIZE = 204; // ~80% of the canvas, leaving an even ~10% margin
const PADDING = (CANVAS_SIZE - CONTENT_SIZE) / 2;

export async function normalizeLogoImage(input: Buffer, backgroundColor: string): Promise<Buffer> {
  const content = await sharp(input)
    .flatten({ background: backgroundColor })
    .resize(CONTENT_SIZE, CONTENT_SIZE, { fit: "contain", background: backgroundColor })
    .toBuffer();

  return sharp(content)
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: backgroundColor,
    })
    .png()
    .toBuffer();
}

// For logos shown standalone (no colored tile/avatar around them) rather
// than in a fixed-size slot next to other content -- just caps the
// dimensions, keeping the source's own aspect ratio and alpha transparency
// intact instead of flattening/padding onto a solid canvas like above.
const MAX_STANDALONE_SIZE = 160;

export async function resizeStandaloneLogo(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(MAX_STANDALONE_SIZE, MAX_STANDALONE_SIZE, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
}
