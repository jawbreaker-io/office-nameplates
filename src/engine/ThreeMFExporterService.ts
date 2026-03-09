import * as THREE from 'three';
import { zipSync, strToU8 } from 'fflate';

export interface ThreeMFMaterial {
  name: string;
  color: string; // hex color e.g. "#A5D1EA"
}

export interface ThreeMFPart {
  name: string;
  geometry: THREE.BufferGeometry;
  material: ThreeMFMaterial;
}

export class ThreeMFExporterService {
  exportToBlob(parts: ThreeMFPart[], assemblyName?: string): Blob {
    const data = this.exportToUint8Array(parts, assemblyName);
    return new Blob([data as BlobPart], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  }

  exportToUint8Array(parts: ThreeMFPart[], assemblyName?: string): Uint8Array {
    const modelXml = this.buildModelXml(parts, assemblyName);

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

  private buildMeshXml(geometry: THREE.BufferGeometry, indent: string): string {
    const posAttr = geometry.getAttribute('position');
    const index = geometry.index;

    const vertices: string[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push(`${indent}    <vertex x="${posAttr.getX(i)}" y="${posAttr.getY(i)}" z="${posAttr.getZ(i)}" />`);
    }

    const triangles: string[] = [];
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        triangles.push(`${indent}    <triangle v1="${index.getX(i)}" v2="${index.getX(i + 1)}" v3="${index.getX(i + 2)}" />`);
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        triangles.push(`${indent}    <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />`);
      }
    }

    return `${indent}<mesh>
${indent}  <vertices>
${vertices.join('\n')}
${indent}  </vertices>
${indent}  <triangles>
${triangles.join('\n')}
${indent}  </triangles>
${indent}</mesh>`;
  }

  private buildModelXml(parts: ThreeMFPart[], assemblyName?: string): string {
    const matId = parts.length + 2;
    const assemblyId = parts.length + 1;

    const bases = parts.map((p) =>
      `      <base name="${p.material.name}" displaycolor="${p.material.color}" />`
    ).join('\n');

    const objects = parts.map((part, i) => {
      const objId = i + 1;
      const meshXml = this.buildMeshXml(part.geometry, '      ');
      return `    <object id="${objId}" name="${part.name}" type="model" pid="${matId}" pindex="${i}">
${meshXml}
    </object>`;
    }).join('\n');

    const components = parts.map((_, i) =>
      `        <component objectid="${i + 1}" />`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="${matId}">
${bases}
    </basematerials>
${objects}
    <object id="${assemblyId}" name="${assemblyName || 'Nameplate'}" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${assemblyId}" />
  </build>
</model>`;
  }
}
