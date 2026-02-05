/**
 * 3D Target zone rendering for Topgolf mode
 * Renders dartboard-style targets with radial segments and concentric rings
 */

import { useMemo } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  DoubleSide,
  Color,
} from 'three';
import { TARGET_ZONES, type TargetZone } from '../config/targets';
import { useGameStore } from '../stores/gameStore';

const NUM_SEGMENTS = 12; // Number of pie slices
const NUM_RINGS = 4; // Number of concentric rings

interface SingleTargetProps {
  zone: TargetZone;
  isHit?: boolean;
}

/**
 * Create a segment geometry (pie slice between two radii)
 */
function createSegmentGeometry(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  segments: number = 8
): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  const angleStep = (endAngle - startAngle) / segments;

  // Create vertices for inner and outer arcs
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Inner vertex
    vertices.push(innerRadius * cos, 0, innerRadius * sin);
    // Outer vertex
    vertices.push(outerRadius * cos, 0, outerRadius * sin);
  }

  // Create triangles
  for (let i = 0; i < segments; i++) {
    const baseIndex = i * 2;
    // First triangle
    indices.push(baseIndex, baseIndex + 1, baseIndex + 3);
    // Second triangle
    indices.push(baseIndex, baseIndex + 3, baseIndex + 2);
  }

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create radial line geometry
 */
function createRadialLineGeometry(
  innerRadius: number,
  outerRadius: number,
  angle: number,
  width: number = 0.1
): BufferGeometry {
  const geometry = new BufferGeometry();
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const perpCos = Math.cos(angle + Math.PI / 2);
  const perpSin = Math.sin(angle + Math.PI / 2);
  const halfWidth = width / 2;

  const vertices = [
    // Inner edge
    innerRadius * cos - halfWidth * perpCos, 0, innerRadius * sin - halfWidth * perpSin,
    innerRadius * cos + halfWidth * perpCos, 0, innerRadius * sin + halfWidth * perpSin,
    // Outer edge
    outerRadius * cos + halfWidth * perpCos, 0, outerRadius * sin + halfWidth * perpSin,
    outerRadius * cos - halfWidth * perpCos, 0, outerRadius * sin - halfWidth * perpSin,
  ];

  const indices = [0, 1, 2, 0, 2, 3];

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create ring outline geometry
 */
function createRingOutlineGeometry(radius: number, width: number = 0.1, segments: number = 64): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const innerRadius = radius - width / 2;
  const outerRadius = radius + width / 2;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    vertices.push(innerRadius * cos, 0, innerRadius * sin);
    vertices.push(outerRadius * cos, 0, outerRadius * sin);
  }

  for (let i = 0; i < segments; i++) {
    const baseIndex = i * 2;
    indices.push(baseIndex, baseIndex + 1, baseIndex + 3);
    indices.push(baseIndex, baseIndex + 3, baseIndex + 2);
  }

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Single target with dartboard pattern - radial segments and concentric rings
 */
function SingleTarget({ zone, isHit = false }: SingleTargetProps) {
  const baseColor = useMemo(() => new Color(zone.color), [zone.color]);
  const darkerColor = useMemo(() => new Color(zone.color).multiplyScalar(0.4), [zone.color]);
  const brighterColor = useMemo(() => {
    const c = new Color(zone.color);
    c.r = Math.min(1, c.r + 0.3);
    c.g = Math.min(1, c.g + 0.3);
    c.b = Math.min(1, c.b + 0.3);
    return c;
  }, [zone.color]);

  // Create segment geometries for dartboard pattern
  const segments = useMemo(() => {
    const result: { geometry: BufferGeometry; color: Color; y: number }[] = [];
    const segmentAngle = (Math.PI * 2) / NUM_SEGMENTS;
    const ringWidth = (zone.outerRadius - zone.innerRadius) / NUM_RINGS;

    // Create alternating segments for each ring
    for (let ring = 0; ring < NUM_RINGS; ring++) {
      const rInner = zone.innerRadius + ring * ringWidth;
      const rOuter = zone.innerRadius + (ring + 1) * ringWidth;

      for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
        const startAngle = seg * segmentAngle;
        const endAngle = (seg + 1) * segmentAngle;
        const geometry = createSegmentGeometry(rInner, rOuter, startAngle, endAngle);

        // Alternate colors for dartboard effect
        const isLight = (ring + seg) % 2 === 0;
        const color = isLight ? baseColor : darkerColor;

        result.push({ geometry, color, y: 0.02 + ring * 0.001 });
      }
    }

    return result;
  }, [zone.innerRadius, zone.outerRadius, baseColor, darkerColor]);

  // Center bullseye
  const centerGeometry = useMemo(() => {
    return createSegmentGeometry(0, zone.innerRadius, 0, Math.PI * 2, 32);
  }, [zone.innerRadius]);

  // Radial lines
  const radialLines = useMemo(() => {
    const result: BufferGeometry[] = [];
    const segmentAngle = (Math.PI * 2) / NUM_SEGMENTS;

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const angle = i * segmentAngle;
      const lineWidth = zone.outerRadius * 0.015;
      result.push(createRadialLineGeometry(zone.innerRadius * 0.3, zone.outerRadius, angle, lineWidth));
    }

    return result;
  }, [zone.innerRadius, zone.outerRadius]);

  // Concentric ring outlines
  const ringOutlines = useMemo(() => {
    const result: BufferGeometry[] = [];
    const ringWidth = (zone.outerRadius - zone.innerRadius) / NUM_RINGS;
    const lineWidth = zone.outerRadius * 0.01;

    // Inner boundary of target
    result.push(createRingOutlineGeometry(zone.innerRadius, lineWidth));

    // Ring boundaries
    for (let ring = 1; ring <= NUM_RINGS; ring++) {
      const radius = zone.innerRadius + ring * ringWidth;
      result.push(createRingOutlineGeometry(radius, lineWidth));
    }

    return result;
  }, [zone.innerRadius, zone.outerRadius]);

  // Materials
  const segmentMaterials = useMemo(() => {
    return segments.map(({ color }) => new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isHit ? 0.85 : 0.55,
      side: DoubleSide,
    }));
  }, [segments, isHit]);

  const centerMaterial = useMemo(() => new MeshBasicMaterial({
    color: brighterColor,
    transparent: true,
    opacity: isHit ? 0.95 : 0.75,
    side: DoubleSide,
  }), [brighterColor, isHit]);

  const lineMaterial = useMemo(() => new MeshBasicMaterial({
    color: brighterColor,
    transparent: true,
    opacity: isHit ? 0.9 : 0.7,
    side: DoubleSide,
  }), [brighterColor, isHit]);

  return (
    <group position={[zone.xOffset, 0, zone.distanceFromTee]}>
      {/* Dartboard segments */}
      {segments.map((seg, i) => (
        <mesh
          key={`seg-${i}`}
          geometry={seg.geometry}
          material={segmentMaterials[i]}
          position={[0, seg.y, 0]}
        />
      ))}

      {/* Center bullseye */}
      <mesh
        geometry={centerGeometry}
        material={centerMaterial}
        position={[0, 0.03, 0]}
      />

      {/* Radial lines */}
      {radialLines.map((geometry, i) => (
        <mesh
          key={`line-${i}`}
          geometry={geometry}
          material={lineMaterial}
          position={[0, 0.035, 0]}
        />
      ))}

      {/* Concentric ring outlines */}
      {ringOutlines.map((geometry, i) => (
        <mesh
          key={`ring-${i}`}
          geometry={geometry}
          material={lineMaterial}
          position={[0, 0.035, 0]}
        />
      ))}
    </group>
  );
}

/**
 * All target zones for Topgolf mode
 * Only renders when gameMode is 'topgolf' and screenMode is 'playing'
 */
export function TargetZones() {
  const gameMode = useGameStore((s) => s.gameMode);
  const screenMode = useGameStore((s) => s.screenMode);
  const lastShotResult = useGameStore((s) => s.topgolf.lastShotResult);

  // Only show in topgolf mode during play
  if (gameMode !== 'topgolf' || screenMode !== 'playing') {
    return null;
  }

  // Determine which zone was hit (if any)
  const hitZoneId = lastShotResult?.zone?.id;

  return (
    <group>
      {TARGET_ZONES.map((zone) => (
        <SingleTarget
          key={zone.id}
          zone={zone}
          isHit={zone.id === hitZoneId}
        />
      ))}
    </group>
  );
}
