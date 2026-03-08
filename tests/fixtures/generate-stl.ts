/**
 * Generates a simple binary STL file of a flat rectangular plate.
 * Used as a test fixture. Run with: npx tsx tests/fixtures/generate-stl.ts
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plate dimensions: 100mm x 30mm x 3mm
const W = 100, H = 30, D = 3;

// A box has 12 triangles (2 per face, 6 faces)
const triangles: number[][] = [];

function addQuad(
  v0: number[], v1: number[], v2: number[], v3: number[],
  nx: number, ny: number, nz: number,
) {
  triangles.push([nx, ny, nz, ...v0, ...v1, ...v2]);
  triangles.push([nx, ny, nz, ...v0, ...v2, ...v3]);
}

// Vertices of a box centered at origin
const x0 = -W / 2, x1 = W / 2;
const y0 = -H / 2, y1 = H / 2;
const z0 = -D / 2, z1 = D / 2;

// Front face (z = z1)
addQuad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1);
// Back face (z = z0)
addQuad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1);
// Top face (y = y1)
addQuad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0, 1, 0);
// Bottom face (y = y0)
addQuad([x1, y0, z1], [x0, y0, z1], [x0, y0, z0], [x1, y0, z0], 0, -1, 0);
// Right face (x = x1)
addQuad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0);
// Left face (x = x0)
addQuad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0);

// Binary STL format:
// 80 bytes header + 4 bytes triangle count + (50 bytes per triangle)
const numTriangles = triangles.length;
const bufferSize = 80 + 4 + numTriangles * 50;
const buffer = Buffer.alloc(bufferSize);

// Header (80 bytes, can be anything)
buffer.write('Binary STL - test fixture', 0);

// Triangle count
buffer.writeUInt32LE(numTriangles, 80);

let offset = 84;
for (const tri of triangles) {
  // Normal (3 floats) + 3 vertices (9 floats) + attribute byte count (1 uint16)
  for (let i = 0; i < 12; i++) {
    buffer.writeFloatLE(tri[i], offset);
    offset += 4;
  }
  buffer.writeUInt16LE(0, offset); // attribute byte count
  offset += 2;
}

writeFileSync(join(__dirname, 'simple-plate.stl'), buffer);
console.log(`Generated simple-plate.stl (${numTriangles} triangles, ${bufferSize} bytes)`);
