import * as THREE from 'three';
import { zipSync, strToU8 } from 'fflate';

export interface ThreeMFMaterial {
  name: string;
  color: string; // hex color e.g. "#A5D1EA"
}

export class ThreeMFExporterService {
  exportToBlob(
    geometry: THREE.BufferGeometry,
    triangleMaterials?: Uint8Array,
    materials?: ThreeMFMaterial[],
  ): Blob {
    const data = this.exportToUint8Array(geometry, triangleMaterials, materials);
    return new Blob([data], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  }

  exportToUint8Array(
    geometry: THREE.BufferGeometry,
    triangleMaterials?: Uint8Array,
    materials?: ThreeMFMaterial[],
  ): Uint8Array {
    const modelXml = this.buildModelXml(geometry, triangleMaterials, materials);

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    return zipSync({
      '[Content_Types].xml': strToU8(contentTypes),
      '_rels/.rels': strToU8(rels),
      '3D/3dmodel.model': strToU8(modelXml),
    });
  }

  private buildModelXml(
    geometry: THREE.BufferGeometry,
    triangleMaterials?: Uint8Array,
    materials?: ThreeMFMaterial[],
  ): string {
    const posAttr = geometry.getAttribute('position');
    const index = geometry.index;
    const hasColors = triangleMaterials && materials && materials.length > 0;

    const vertices: string[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push(`        <vertex x="${posAttr.getX(i)}" y="${posAttr.getY(i)}" z="${posAttr.getZ(i)}" />`);
    }

    const triangles: string[] = [];
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const triIdx = i / 3;
        const colorAttr = hasColors ? ` pid="1" p1="${triangleMaterials[triIdx]}"` : '';
        triangles.push(`        <triangle v1="${index.getX(i)}" v2="${index.getX(i + 1)}" v3="${index.getX(i + 2)}"${colorAttr} />`);
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        const triIdx = i / 3;
        const colorAttr = hasColors ? ` pid="1" p1="${triangleMaterials[triIdx]}"` : '';
        triangles.push(`        <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}"${colorAttr} />`);
      }
    }

    let materialsXml = '';
    if (hasColors) {
      const bases = materials.map((m) => `      <base name="${m.name}" displaycolor="${m.color}" />`).join('\n');
      materialsXml = `
    <basematerials id="1">
${bases}
    </basematerials>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>${materialsXml}
    <object id="2" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="2" />
  </build>
</model>`;
  }
}
