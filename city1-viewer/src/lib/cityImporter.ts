import * as THREE from 'three';
import { SurfaceType, classifyPixel } from './surfaceColors';

export interface Building {
  id: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  baseHeight: number;
  extrudeHeight: number;
  uvMin: [number, number];
  uvMax: [number, number];
  avgColor: [number, number, number];
}

export interface ImportResult {
  buildings: Building[];
  processedHeightTexture: THREE.CanvasTexture;
}

function loadImageToCanvas(src: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx });
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Step 1: Classify every pixel in the surfacemap
function classifySurface(surfaceData: ImageData): Uint8Array {
  const w = surfaceData.width;
  const h = surfaceData.height;
  const classification = new Uint8Array(w * h); // 0=unknown, 1=building, 2=road, 3=park, 4=water
  const d = surfaceData.data;

  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    const type = classifyPixel(r, g, b);
    switch (type) {
      case SurfaceType.Building: classification[i] = 1; break;
      case SurfaceType.Road: classification[i] = 2; break;
      case SurfaceType.Park: classification[i] = 3; break;
      case SurfaceType.Water: classification[i] = 4; break;
      default: classification[i] = 0;
    }
  }

  return classification;
}

// Step 2: Scale height variation toward global average
function applyHeightPercent(heightData: ImageData, percent: number) {
  const d = heightData.data;
  const total = heightData.width * heightData.height;

  // Compute global average
  let sum = 0;
  for (let i = 0; i < total; i++) {
    sum += d[i * 4];
  }
  const avg = sum / total;

  // Scale each pixel toward the average
  const scale = percent / 100;
  for (let i = 0; i < total; i++) {
    const v = Math.round(avg + (d[i * 4] - avg) * scale);
    const clamped = Math.max(0, Math.min(255, v));
    d[i * 4] = clamped;
    d[i * 4 + 1] = clamped;
    d[i * 4 + 2] = clamped;
  }
}

// Step 3: Smooth road heights via iterative averaging + buffer influence
function smoothRoadHeights(
  heightData: ImageData,
  classification: Uint8Array,
  passes: number = 50,
  bufferRadius: number = 16
) {
  const w = heightData.width;
  const h = heightData.height;
  const d = heightData.data;

  // Extract grayscale heights (use red channel)
  const heights = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    heights[i] = d[i * 4];
  }

  // Iterative averaging on road pixels — include ALL neighbors (not just road)
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < passes; pass++) {
    tmp.set(heights);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (classification[idx] !== 2) continue; // road only

        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            sum += tmp[(y + dy) * w + (x + dx)];
            count++;
          }
        }
        heights[idx] = sum / count;
      }
    }
  }

  // Final wide-kernel pass: 5x5 average for additional smoothing
  tmp.set(heights);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = y * w + x;
      if (classification[idx] !== 2) continue;
      let sum = 0;
      let count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          sum += tmp[(y + dy) * w + (x + dx)];
          count++;
        }
      }
      heights[idx] = sum / count;
    }
  }

  // Buffer influence: blend non-road pixels near roads toward nearest road height
  const distToRoad = new Float32Array(w * h).fill(Infinity);
  const nearestRoadHeight = new Float32Array(w * h);

  const queue: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (classification[i] === 2) {
      distToRoad[i] = 0;
      nearestRoadHeight[i] = heights[i];
      queue.push(i);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;
    const curDist = distToRoad[idx];
    if (curDist >= bufferRadius) continue;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        const newDist = curDist + 1;
        if (newDist < distToRoad[ni]) {
          distToRoad[ni] = newDist;
          nearestRoadHeight[ni] = nearestRoadHeight[idx];
          queue.push(ni);
        }
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (classification[i] === 2) continue;
    if (classification[i] === 1) continue;
    const dist = distToRoad[i];
    if (dist > 0 && dist <= bufferRadius) {
      const t = 1 - dist / bufferRadius;
      heights[i] = heights[i] * (1 - t) + nearestRoadHeight[i] * t;
    }
  }

  // Write back
  for (let i = 0; i < w * h; i++) {
    const v = Math.round(Math.max(0, Math.min(255, heights[i])));
    d[i * 4] = v;
    d[i * 4 + 1] = v;
    d[i * 4 + 2] = v;
  }

  return heights;
}

// Step 4: Stamp sidewalks — expand building footprints and mark as road
function stampSidewalks(
  classification: Uint8Array,
  buildings: Building[],
  w: number,
  h: number,
  sidewalkWidth: number = 6
) {
  for (const b of buildings) {
    // Convert world coords back to pixel coords
    const midPx = ((b.x + 50) / 100) * w;
    const midPy = ((b.z + 74.5) / 149) * h;
    const halfW = (b.width / 100) * w / 2;
    const halfH = (b.depth / 149) * h / 2;

    const pxMinX = Math.max(0, Math.floor(midPx - halfW - sidewalkWidth));
    const pxMaxX = Math.min(w - 1, Math.ceil(midPx + halfW + sidewalkWidth));
    const pxMinY = Math.max(0, Math.floor(midPy - halfH - sidewalkWidth));
    const pxMaxY = Math.min(h - 1, Math.ceil(midPy + halfH + sidewalkWidth));

    for (let py = pxMinY; py <= pxMaxY; py++) {
      for (let px = pxMinX; px <= pxMaxX; px++) {
        const idx = py * w + px;
        if (classification[idx] !== 1) {
          classification[idx] = 2; // mark as road
        }
      }
    }
  }
}

// Step 5: Extract buildings via connected-component labeling
function extractBuildings(
  classification: Uint8Array,
  heights: Float32Array,
  detailData: ImageData,
  w: number,
  h: number,
  minArea: number = 50
): Building[] {
  const dd = detailData.data;
  const visited = new Uint8Array(w * h);
  const buildings: Building[] = [];
  let nextId = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (classification[idx] !== 1 || visited[idx]) continue;

      // Flood fill
      const component: number[] = [];
      const stack = [idx];
      visited[idx] = 1;

      while (stack.length > 0) {
        const ci = stack.pop()!;
        component.push(ci);
        const cx = ci % w;
        const cy = (ci - cx) / w;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const ni = ny * w + nx;
            if (!visited[ni] && classification[ni] === 1) {
              visited[ni] = 1;
              stack.push(ni);
            }
          }
        }
      }

      if (component.length < minArea) continue;

      // Bounding rect
      let minX = w, maxX = 0, minY = h, maxY = 0;
      let heightSum = 0;
      let heightMin = 255, heightMax = 0;

      for (const ci of component) {
        const cx = ci % w;
        const cy = (ci - cx) / w;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        heightSum += heights[ci];
        if (heights[ci] < heightMin) heightMin = heights[ci];
        if (heights[ci] > heightMax) heightMax = heights[ci];
      }

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      const rectW = maxX - minX + 1;
      const rectH = maxY - minY + 1;

      // Convert to world coords
      const worldX = (midX / w) * 100 - 50;
      const worldZ = (midY / h) * 149 - 74.5;
      const bWidth = (rectW / w) * 100;
      const bDepth = (rectH / h) * 149;

      // Temporary baseHeight from raw heightmap average (will be overwritten by punchout)
      const avgHeight = heightSum / component.length;
      const baseHeight = (avgHeight / 255) * 12; // heightScale = 12

      // Extrusion height from variation
      const extrudeHeight = Math.max(0.5, ((heightMax - heightMin) / 255) * 12);

      // UV bounds
      const u0 = minX / w;
      const u1 = (maxX + 1) / w;
      const v0 = 1 - (maxY + 1) / h;
      const v1 = 1 - minY / h;

      // Average color from detailmap within building pixel bounds
      let rSum = 0, gSum = 0, bSum = 0, colorCount = 0;
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const pi = (py * w + px) * 4;
          rSum += dd[pi];
          gSum += dd[pi + 1];
          bSum += dd[pi + 2];
          colorCount++;
        }
      }
      const avgColor: [number, number, number] = colorCount > 0
        ? [rSum / colorCount / 255, gSum / colorCount / 255, bSum / colorCount / 255]
        : [0.5, 0.5, 0.5];

      buildings.push({
        id: nextId++,
        x: worldX,
        z: worldZ,
        width: bWidth,
        depth: bDepth,
        baseHeight,
        extrudeHeight,
        uvMin: [u0, v0],
        uvMax: [u1, v1],
        avgColor,
      });
    }
  }

  return buildings;
}

// BFS-based flatten: replace every building pixel's height with nearest non-building ground height
function flattenBuildingPixels(
  heightData: ImageData,
  classification: Uint8Array
) {
  const w = heightData.width;
  const h = heightData.height;
  const d = heightData.data;
  const total = w * h;

  const resultHeight = new Float32Array(total);
  const visited = new Uint8Array(total);

  // Seed queue with all non-building pixels
  const queue: number[] = [];
  for (let i = 0; i < total; i++) {
    if (classification[i] !== 1) {
      resultHeight[i] = d[i * 4];
      visited[i] = 1;
      queue.push(i);
    }
  }

  // BFS into building pixels — inherit height of nearest non-building neighbor
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        if (visited[ni]) continue;
        visited[ni] = 1;
        resultHeight[ni] = resultHeight[idx];
        queue.push(ni);
      }
    }
  }

  // Write back only building pixels
  for (let i = 0; i < total; i++) {
    if (classification[i] === 1) {
      const v = Math.round(Math.max(0, Math.min(255, resultHeight[i])));
      d[i * 4] = v;
      d[i * 4 + 1] = v;
      d[i * 4 + 2] = v;
    }
  }
}

// Step 4: Punchout — flatten heightmap under and around buildings, update building baseHeight
function punchoutBuildings(
  heightData: ImageData,
  classification: Uint8Array,
  buildings: Building[],
  w: number,
  h: number,
  heightScale: number = 12,
  buffer: number = 5
) {
  const d = heightData.data;

  for (const b of buildings) {
    // Convert world coords back to pixel coords
    const midPx = ((b.x + 50) / 100) * w;
    const midPy = ((b.z + 74.5) / 149) * h;
    const halfW = (b.width / 100) * w / 2;
    const halfH = (b.depth / 149) * h / 2;

    const pxMinX = Math.max(0, Math.floor(midPx - halfW - buffer));
    const pxMaxX = Math.min(w - 1, Math.ceil(midPx + halfW + buffer));
    const pxMinY = Math.max(0, Math.floor(midPy - halfH - buffer));
    const pxMaxY = Math.min(h - 1, Math.ceil(midPy + halfH + buffer));

    // Find average road height at perimeter
    let perimSum = 0;
    let perimCount = 0;
    for (let px = pxMinX; px <= pxMaxX; px++) {
      for (const py of [pxMinY, pxMaxY]) {
        const idx = py * w + px;
        if (classification[idx] === 2) {
          perimSum += d[idx * 4];
          perimCount++;
        }
      }
    }
    for (let py = pxMinY + 1; py < pxMaxY; py++) {
      for (const px of [pxMinX, pxMaxX]) {
        const idx = py * w + px;
        if (classification[idx] === 2) {
          perimSum += d[idx * 4];
          perimCount++;
        }
      }
    }

    const flatHeight = perimCount > 0 ? Math.round(perimSum / perimCount) : Math.round(b.baseHeight / heightScale * 255);

    // Update building baseHeight to match the punchout terrain value
    b.baseHeight = (flatHeight / 255) * heightScale;

    // Flatten the region
    for (let py = pxMinY; py <= pxMaxY; py++) {
      for (let px = pxMinX; px <= pxMaxX; px++) {
        const idx = py * w + px;
        d[idx * 4] = flatHeight;
        d[idx * 4 + 1] = flatHeight;
        d[idx * 4 + 2] = flatHeight;
      }
    }
  }
}

export async function runCityImport(heightPercent: number = 40): Promise<ImportResult> {
  // Load all three maps
  const [heightResult, surfaceResult, detailResult] = await Promise.all([
    loadImageToCanvas('./assets/city/heightmap.jpeg'),
    loadImageToCanvas('./assets/city/surfacemap.jpeg'),
    loadImageToCanvas('./assets/city/detailmap.jpeg'),
  ]);

  const w = heightResult.canvas.width;
  const h = heightResult.canvas.height;

  // Step 1: Classify surface
  const surfaceData = surfaceResult.ctx.getImageData(0, 0, w, h);
  const classification = classifySurface(surfaceData);

  // Step 2: Apply height percent — scale heightmap variation toward average
  const heightData = heightResult.ctx.getImageData(0, 0, w, h);
  applyHeightPercent(heightData, heightPercent);

  // Step 3: Extract heights from scaled data, then extract buildings
  const hd = heightData.data;
  const heights = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    heights[i] = hd[i * 4];
  }
  const detailData = detailResult.ctx.getImageData(0, 0, w, h);
  const buildings = extractBuildings(classification, heights, detailData, w, h);

  // Step 4: Flatten building pixels — BFS replace building heights with nearest ground height
  flattenBuildingPixels(heightData, classification);

  // Step 5: Stamp sidewalks — expand building footprints, mark as road
  stampSidewalks(classification, buildings, w, h);

  // Step 6: Smooth road heights (now includes sidewalk pixels)
  smoothRoadHeights(heightData, classification);

  // Step 7: Punchout buildings — flatten under buildings, update baseHeight
  punchoutBuildings(heightData, classification, buildings, w, h);

  // Write modified height data back to canvas
  heightResult.ctx.putImageData(heightData, 0, 0);

  // Step 8: Create texture from processed heightmap
  const processedHeightTexture = new THREE.CanvasTexture(heightResult.canvas);
  processedHeightTexture.colorSpace = THREE.LinearSRGBColorSpace;
  processedHeightTexture.needsUpdate = true;

  return { buildings, processedHeightTexture };
}
