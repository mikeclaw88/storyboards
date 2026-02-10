// Fallback custom shaders — only needed if MeshStandardMaterial displacement looks bad

export const cityVertexShader = /* glsl */ `
  uniform sampler2D heightMap;
  uniform float heightScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;

    // Sample heightmap for displacement
    float height = texture2D(heightMap, uv).r * heightScale;

    // Displace vertex along normal (Y axis after rotation)
    vec3 displaced = position + normal * height;

    // Compute approximate normals from heightmap gradients
    float texelSize = 1.0 / 512.0;
    float hL = texture2D(heightMap, uv - vec2(texelSize, 0.0)).r * heightScale;
    float hR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r * heightScale;
    float hD = texture2D(heightMap, uv - vec2(0.0, texelSize)).r * heightScale;
    float hU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r * heightScale;
    vec3 computedNormal = normalize(vec3(hL - hR, 2.0, hD - hU));

    vNormal = normalize(normalMatrix * computedNormal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const cityFragmentShader = /* glsl */ `
  uniform sampler2D detailMap;
  uniform vec3 lightDirection;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec4 detailColor = texture2D(detailMap, vUv);

    // Basic directional lighting
    float diffuse = max(dot(vNormal, normalize(lightDirection)), 0.0);
    float ambient = 0.4;
    float light = ambient + diffuse * 0.6;

    gl_FragColor = vec4(detailColor.rgb * light, 1.0);
  }
`;
