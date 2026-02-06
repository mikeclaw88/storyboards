import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

const skyboxVertexShader = `
  varying vec3 vWorldDirection;
  void main() {
    vWorldDirection = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_Position.z = gl_Position.w;
  }
`;

const skyboxFragmentShader = `
  uniform samplerCube cubemap;
  uniform float upperSquish;
  uniform float lowerSquish;
  uniform float horizonStretch;
  varying vec3 vWorldDirection;

  void main() {
    vec3 viewDir = normalize(vWorldDirection);
    float y = viewDir.y;

    if (y > 0.0) {
      y = pow(y, upperSquish);
    } else {
      y = -pow(abs(y), lowerSquish);
    }

    y = y * horizonStretch;
    y = clamp(y, -1.0, 1.0);

    float xzLen = length(viewDir.xz);
    vec2 xz = (xzLen > 0.001) ? (viewDir.xz / xzLen) * sqrt(1.0 - y * y) : vec2(0.0, 0.0);
    vec3 newDir = normalize(vec3(xz.x, y, xz.y));

    gl_FragColor = textureCube(cubemap, newDir);
  }
`;

interface SkyboxProps {
  cubemapPath: string;
  upperSquish?: number;
  lowerSquish?: number;
  horizonStretch?: number;
}

export function Skybox({
  cubemapPath,
  upperSquish = 1.0,
  lowerSquish = 1.0,
  horizonStretch = 1.0,
}: SkyboxProps) {
  const [cubeTexture, setCubeTexture] = useState<THREE.CubeTexture | null>(null);

  useEffect(() => {
    const path = cubemapPath.endsWith('/') ? cubemapPath : cubemapPath + '/';
    const loader = new THREE.CubeTextureLoader();
    loader.setPath(path);
    loader.load(
      ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'],
      (texture) => setCubeTexture(texture),
      undefined,
      (err) => console.error('Skybox cubemap load error:', err),
    );
  }, [cubemapPath]);

  const [geometry, material] = useMemo(() => {
    const geo = new THREE.SphereGeometry(5000, 32, 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        cubemap: { value: cubeTexture },
        upperSquish: { value: upperSquish },
        lowerSquish: { value: lowerSquish },
        horizonStretch: { value: horizonStretch },
      },
      vertexShader: skyboxVertexShader,
      fragmentShader: skyboxFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    });
    return [geo, mat];
  }, [cubeTexture, upperSquish, lowerSquish, horizonStretch]);

  if (!cubeTexture) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-1000}
      frustumCulled={false}
    />
  );
}
