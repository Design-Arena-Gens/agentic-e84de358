export function createSolidImage(width: number, height: number, r: number, g: number, b: number, a: number = 255): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
  }
  return new ImageData(data, width, height);
}

export function generateGradientImage(width: number, height: number, a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, direction: 'horizontal' | 'vertical'): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = direction === 'horizontal' ? x / (width - 1) : y / (height - 1);
      const r = Math.round(a.r * (1 - t) + b.r * t);
      const g = Math.round(a.g * (1 - t) + b.g * t);
      const bl = Math.round(a.b * (1 - t) + b.b * t);
      const idx = (y * width + x) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = bl; data[idx + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

// Simple seeded PRNG
function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePerlinNoise(width: number, height: number, scale: number, seed: number): ImageData {
  const rand = mulberry32(seed >>> 0);
  const gradX: number[][] = [];
  const gradY: number[][] = [];
  const gridW = Math.ceil(width / scale) + 2;
  const gridH = Math.ceil(height / scale) + 2;
  for (let gy = 0; gy < gridH; gy++) {
    gradX[gy] = [];
    gradY[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      const angle = rand() * Math.PI * 2;
      gradX[gy][gx] = Math.cos(angle);
      gradY[gy][gx] = Math.sin(angle);
    }
  }
  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const fx = x / scale;
      const fy = y / scale;
      const x0 = Math.floor(fx); const y0 = Math.floor(fy);
      const dx = fx - x0; const dy = fy - y0;

      const g00x = gradX[y0][x0]; const g00y = gradY[y0][x0];
      const g10x = gradX[y0][x0 + 1]; const g10y = gradY[y0][x0 + 1];
      const g01x = gradX[y0 + 1][x0]; const g01y = gradY[y0 + 1][x0];
      const g11x = gradX[y0 + 1][x0 + 1]; const g11y = gradY[y0 + 1][x0 + 1];

      const n00 = g00x * dx + g00y * dy;
      const n10 = g10x * (dx - 1) + g10y * dy;
      const n01 = g01x * dx + g01y * (dy - 1);
      const n11 = g11x * (dx - 1) + g11y * (dy - 1);

      const u = fade(dx); const v = fade(dy);
      const nx0 = lerp(n00, n10, u);
      const nx1 = lerp(n01, n11, u);
      const n = lerp(nx0, nx1, v);

      const val = Math.floor((n * 0.5 + 0.5) * 255);
      const idx = (y * width + x) * 4;
      data[idx] = val; data[idx + 1] = val; data[idx + 2] = val; data[idx + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}

export function blendImages(a: ImageData | null, b: ImageData | null, mode: 'add' | 'multiply' | 'overlay' | 'screen' | 'difference', opacity: number): ImageData | null {
  const img = a || b;
  if (!img) return null;
  const width = img.width; const height = img.height;
  const out = new Uint8ClampedArray(width * height * 4);
  const ad = a ? a.data : new Uint8ClampedArray(width * height * 4);
  const bd = b ? b.data : new Uint8ClampedArray(width * height * 4);

  function blendChannel(A: number, B: number): number {
    switch (mode) {
      case 'add': return Math.min(255, A + B);
      case 'multiply': return Math.round((A * B) / 255);
      case 'overlay': return A < 128 ? Math.round((2 * A * B) / 255) : 255 - Math.round(2 * (255 - A) * (255 - B) / 255);
      case 'screen': return 255 - Math.round(((255 - A) * (255 - B)) / 255);
      case 'difference': return Math.abs(A - B);
      default: return B;
    }
  }

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = blendChannel(ad[idx], bd[idx]);
    const g = blendChannel(ad[idx + 1], bd[idx + 1]);
    const bl = blendChannel(ad[idx + 2], bd[idx + 2]);
    const aA = ad[idx + 3] / 255; const aB = bd[idx + 3] / 255;
    const aOut = Math.max(aA, aB);

    // opacity mix over A
    out[idx] = Math.round(ad[idx] * (1 - opacity) + r * opacity);
    out[idx + 1] = Math.round(ad[idx + 1] * (1 - opacity) + g * opacity);
    out[idx + 2] = Math.round(ad[idx + 2] * (1 - opacity) + bl * opacity);
    out[idx + 3] = Math.round(aOut * 255);
  }

  return new ImageData(out, width, height);
}
