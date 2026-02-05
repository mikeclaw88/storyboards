import * as THREE from 'three';

/**
 * Creates a skymap mesh from a CubeTexture.
 * Port of threex.skymap (https://github.com/jeromeetienne/threex.skymap)
 * to modern Three.js ES modules.
 */
export function createSkymap(textureCube: THREE.CubeTexture, size = 500): THREE.Mesh {
  const shader = THREE.ShaderLib['cube'];

  const material = new THREE.ShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    depthWrite: false,
    side: THREE.BackSide,
  });

  material.uniforms['tCube'].value = textureCube;

  const geometry = new THREE.BoxGeometry(size, size, size);
  return new THREE.Mesh(geometry, material);
}
