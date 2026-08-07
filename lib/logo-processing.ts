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
const DEFAULT_BACKGROUND = "#ffffff";

// Detects the color a logo's own artwork uses as its background (e.g. a
// solid-color tile) by sampling its four corners, so the padding we add
// below always matches instead of requiring a manually-configured color
// that's easy to leave mismatched. Falls back to white when the corners
// are transparent (an irregular mark with no background of its own, e.g.
// a circle/hex inscribed in a transparent square -- a circle doesn't reach
// the corners of its own bounding box) or disagree with each other.
async function detectBackgroundColor(input: Buffer): Promise<string> {
  const { data, info } = await sharp(input).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  function pixelAt(x: number, y: number) {
    const idx = (y * width + x) * channels;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
  }

  const corners = [
    pixelAt(0, 0),
    pixelAt(width - 1, 0),
    pixelAt(0, height - 1),
    pixelAt(width - 1, height - 1),
  ];

  const OPAQUE_THRESHOLD = 250;
  const AGREEMENT_TOLERANCE = 12;
  if (corners.some((c) => c.a < OPAQUE_THRESHOLD)) return DEFAULT_BACKGROUND;

  const [first, ...rest] = corners;
  const agree = rest.every(
    (c) =>
      Math.abs(c.r - first.r) <= AGREEMENT_TOLERANCE &&
      Math.abs(c.g - first.g) <= AGREEMENT_TOLERANCE &&
      Math.abs(c.b - first.b) <= AGREEMENT_TOLERANCE,
  );
  if (!agree) return DEFAULT_BACKGROUND;

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(first.r)}${toHex(first.g)}${toHex(first.b)}`;
}

export async function normalizeLogoImage(input: Buffer): Promise<Buffer> {
  // Design-tool exports often carry extra transparent canvas padding around
  // the actual artwork -- trim that away first so the mark itself (not
  // however much blank canvas the source happened to have) fills the same
  // ~80% below for every logo, regardless of how tightly each one was
  // originally cropped. A no-op on already-opaque sources with no
  // transparent border to find.
  const trimmed = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const backgroundColor = await detectBackgroundColor(trimmed);

  const content = await sharp(trimmed)
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
