// OKLCH to sRGB and Display P3, WCAG 2 relative luminance, and the two solves
// virtu color needs: the OKLCH lightness that gives a target luminance, and
// the most chroma a hue can hold at that luminance inside a gamut (sRGB or
// Display P3). The matrices are the ones CSS Color 4 publishes, which Color.js
// also uses, so the numbers agree with the downstream token tools. Pure
// functions, no dependencies.

/** Linear-light sRGB, each channel 0 to 1 when the color is in gamut. */
export type LinearRgb = readonly [number, number, number];

const OKLAB_TO_LMS = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
] as const;

const LMS_TO_XYZ = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
] as const;

const XYZ_TO_LINEAR_SRGB = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
] as const;

const XYZ_TO_LINEAR_P3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
] as const;

const LINEAR_P3_TO_XYZ = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0.0, 0.04511338185890264, 1.043944368900976],
] as const;

type Row = readonly [number, number, number];
type Matrix = readonly [Row, Row, Row];

function times(m: Matrix, v: readonly [number, number, number]): [number, number, number] {
  const row = (r: Row): number => r[0] * v[0] + r[1] * v[1] + r[2] * v[2];
  return [row(m[0]), row(m[1]), row(m[2])];
}

export function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

export function oklabToLinearSrgb(l: number, a: number, b: number): LinearRgb {
  const lms = times(OKLAB_TO_LMS, [l, a, b]).map((x) => x * x * x) as [number, number, number];
  return times(XYZ_TO_LINEAR_SRGB, times(LMS_TO_XYZ, lms));
}

export function oklchToLinearSrgb(l: number, c: number, h: number): LinearRgb {
  const [L, a, b] = oklchToOklab(l, c, h);
  return oklabToLinearSrgb(L, a, b);
}

const LINEAR_SRGB_TO_XYZ = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
] as const;

const XYZ_TO_LMS = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
] as const;

const LMS_TO_OKLAB = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
] as const;

/** Linear-light sRGB to OKLab, the inverse of oklabToLinearSrgb. Extended: channels outside 0 to 1 are allowed. */
export function linearSrgbToOklab(rgb: LinearRgb): [number, number, number] {
  const lms = times(XYZ_TO_LMS, times(LINEAR_SRGB_TO_XYZ, rgb)).map(Math.cbrt) as [number, number, number];
  return times(LMS_TO_OKLAB, lms);
}

/** Linear-light Display P3, each channel 0 to 1 when the color is inside P3. */
export function oklchToLinearP3(l: number, c: number, h: number): LinearRgb {
  const [L, a, b] = oklchToOklab(l, c, h);
  const lms = times(OKLAB_TO_LMS, [L, a, b]).map((x) => x * x * x) as [number, number, number];
  return times(XYZ_TO_LINEAR_P3, times(LMS_TO_XYZ, lms));
}

/** Linear Display P3 to linear sRGB, unclipped: a P3 color outside sRGB gets a channel below 0 or above 1. */
export function linearP3ToLinearSrgb(rgb: LinearRgb): LinearRgb {
  return times(XYZ_TO_LINEAR_SRGB, times(LINEAR_P3_TO_XYZ, rgb));
}

/** The sRGB transfer function's inverse: an encoded value to linear light. Display P3 uses the same curve. */
export function decode(x: number): number {
  const abs = Math.abs(x);
  return abs <= 0.04045 ? x / 12.92 : Math.sign(x) * ((abs + 0.055) / 1.055) ** 2.4;
}

/** The sRGB transfer function: linear light to the encoded value, extended to negative values as CSS Color 4 does. */
export function encode(x: number): number {
  const abs = Math.abs(x);
  return abs <= 0.0031308 ? 12.92 * x : Math.sign(x) * (1.055 * abs ** (1 / 2.4) - 0.055);
}

/** WCAG 2 relative luminance of linear-light sRGB. */
export function luminance(rgb: LinearRgb): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * WCAG 2 relative luminance of linear-light Display P3. WCAG 2 defines
 * luminance on sRGB only. This applies its formula to the color's linear sRGB
 * coordinates, extended linearly outside sRGB, so a P3 color that is also an
 * sRGB color gets exactly the luminance WCAG gives it, and every other P3
 * color gets CIE Y to within WCAG's rounding of the coefficients.
 */
export function luminanceP3(rgb: LinearRgb): number {
  return luminance(linearP3ToLinearSrgb(rgb));
}

/** WCAG 2 contrast ratio of two relative luminances. */
export function contrastOf(ya: number, yb: number): number {
  return (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
}

/** Inside sRGB, allowing a rounding error far below one 8-bit step. */
export function inGamut(rgb: LinearRgb, epsilon = 1e-9): boolean {
  return rgb.every((x) => x >= -epsilon && x <= 1 + epsilon);
}

const ITERATIONS = 60;

/**
 * The OKLCH lightness at which a hue and chroma have relative luminance y.
 * Luminance rises with lightness at fixed hue and chroma, so bisection finds
 * it. OKLCH lightness alone does not fix luminance, which is why the solve is
 * needed: equal L across hues gives different WCAG ratios.
 */
export function lightnessFor(y: number, c: number, h: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    if (luminance(oklchToLinearSrgb(mid, c, h)) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The gamuts virtu color places colors in. */
export type Gamut = "srgb" | "p3";

/**
 * A color placed at an exact luminance: its OKLCH coordinates and its linear
 * coordinates in the gamut it was placed in (sRGB or Display P3).
 */
export type Placed = { l: number; c: number; h: number; rgb: LinearRgb; reduced: boolean };

/**
 * The color of hue h with the most chroma up to maxChroma whose relative
 * luminance is y and which lies inside the gamut. When maxChroma does not fit,
 * the chroma is reduced at fixed luminance and fixed hue until it does. RGB is
 * never clipped, so neither the luminance nor the hue moves. Luminance is
 * linear in light, so the lightness solve is the same for both gamuts; only
 * the gamut test differs.
 */
export function place(y: number, h: number, maxChroma: number, gamut: Gamut = "srgb"): Placed {
  const linear = gamut === "p3" ? oklchToLinearP3 : oklchToLinearSrgb;
  const at = (c: number): Placed => {
    const l = lightnessFor(y, c, h);
    return { l, c, h, rgb: linear(l, c, h), reduced: c < maxChroma };
  };
  const full = at(maxChroma);
  if (inGamut(full.rgb)) return full;
  // A gray at any luminance between 0 and 1 is in both gamuts, so 0 is a lower bound.
  let lo = 0;
  let hi = maxChroma;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(at(mid).rgb)) lo = mid;
    else hi = mid;
  }
  return at(lo);
}

/** An sRGB color as the bytes, the components, and the hex a DTCG file holds. */
export type Quantized = { bytes: [number, number, number]; components: [number, number, number]; hex: string };

/**
 * Rounds linear sRGB to 8-bit sRGB. The components are the bytes over 255,
 * rounded to four decimals, so they round back to the same bytes and the
 * components and hex in the file name one color.
 */
export function quantize(rgb: LinearRgb): Quantized {
  const byte = (x: number): number => Math.round(Math.min(1, Math.max(0, encode(Math.min(1, Math.max(0, x))))) * 255);
  const bytes: [number, number, number] = [byte(rgb[0]), byte(rgb[1]), byte(rgb[2])];
  const components = bytes.map((b) => Math.round((b / 255) * 10000) / 10000) as [number, number, number];
  const hex = `#${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  return { bytes, components, hex };
}

/**
 * Rounds linear Display P3 to the components a DTCG file holds: the encoded
 * channels to four decimals, the precision virtu writes every component at.
 * CSS takes color(display-p3 ...) at any precision, so there is no byte grid.
 */
export function quantizeP3(rgb: LinearRgb): [number, number, number] {
  return rgb.map((x) => Math.round(Math.min(1, Math.max(0, encode(Math.min(1, Math.max(0, x))))) * 10000) / 10000) as [number, number, number];
}
