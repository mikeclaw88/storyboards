/**
 * Terrain GLSL shaders for texture splatting
 * Height displacement is done on CPU for alignment with collision mesh
 */

export const terrainVertexPars = /* glsl */ `
  uniform vec2 uTerrainSize;
  varying vec2 vTerrainUv;
  varying float vViewDistance;
`;

export const terrainVertexMain = /* glsl */ `
  vTerrainUv = uv;

  // Vertices are already displaced on CPU - just compute view distance
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDistance = length(cameraPosition - worldPos.xyz);
`;

export const terrainFragmentPars = /* glsl */ `
  varying vec2 vTerrainUv;
  varying float vViewDistance;

  #ifdef USE_PHOTO_TEXTURE
    uniform sampler2D uPhotoTexture;
  #else
    uniform sampler2D uSplatMap;
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform sampler2D uTexture3;
    uniform sampler2D uNormal0;
    uniform sampler2D uNormal1;
    uniform sampler2D uNormal2;
    uniform sampler2D uNormal3;
    uniform float uTileScale;
    uniform vec2 uTerrainSize;
  #endif

  #ifndef USE_PHOTO_TEXTURE
    #ifdef USE_DETAIL_MAPS
      uniform sampler2D uDetail0;
      uniform sampler2D uDetail1;
      uniform sampler2D uDetail2;
      uniform sampler2D uDetail3;
      uniform sampler2D uDetailNormal0;
      uniform sampler2D uDetailNormal1;
      uniform sampler2D uDetailNormal2;
      uniform sampler2D uDetailNormal3;
      // vec4: (tileScale, strength, fadeStart, fadeEnd)
      uniform vec4 uDetailSettings0;
      uniform vec4 uDetailSettings1;
      uniform vec4 uDetailSettings2;
      uniform vec4 uDetailSettings3;
    #endif

    #ifdef USE_MACRO_NOISE
      uniform sampler2D uMacroNoise;
      uniform float uMacroScale;
      uniform float uMacroStrength;
    #endif

    // Helper: calculate detail fade factor based on distance
    float calcDetailFade(float dist, float fadeStart, float fadeEnd) {
      return 1.0 - clamp((dist - fadeStart) / (fadeEnd - fadeStart), 0.0, 1.0);
    }

    #ifdef USE_STOCHASTIC_TILING
      // Stochastic tiling based on Deliot & Heitz 2019
      // Breaks texture repetition by sampling 3 times with random rotations

      vec2 stochasticHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx + p3.yz) * p3.zy);
      }

      mat2 stochasticRotate(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      vec4 textureStochastic(sampler2D tex, vec2 uv) {
        // Higher scale = more cells = more variation (3-5 works well)
        const float GRID_SCALE = 3.5;
        vec2 scaledUv = uv * GRID_SCALE;

        // Skew to triangular grid (simplex-style)
        const float SKEW = 0.577350269; // 1/sqrt(3)
        vec2 skewed = scaledUv + vec2(scaledUv.y * SKEW, 0.0);
        vec2 baseCell = floor(skewed);
        vec2 cellFract = fract(skewed);

        // Determine which triangle and compute barycentric coords
        vec2 v0, v1, v2;
        vec3 bary;

        if (cellFract.x > cellFract.y) {
          v0 = baseCell;
          v1 = baseCell + vec2(1.0, 0.0);
          v2 = baseCell + vec2(1.0, 1.0);
          bary = vec3(1.0 - cellFract.x, cellFract.x - cellFract.y, cellFract.y);
        } else {
          v0 = baseCell;
          v1 = baseCell + vec2(0.0, 1.0);
          v2 = baseCell + vec2(1.0, 1.0);
          bary = vec3(1.0 - cellFract.y, cellFract.y - cellFract.x, cellFract.x);
        }

        // Contrast-preserving weight smoothing (higher power = sharper)
        bary = bary * bary * bary * bary; // x^4 for sharper transitions
        bary /= (bary.x + bary.y + bary.z);

        // Hash each vertex for random transform
        vec2 h0 = stochasticHash(v0);
        vec2 h1 = stochasticHash(v1);
        vec2 h2 = stochasticHash(v2);

        // Use 90-degree rotation steps (0, 90, 180, 270) - works better for grass
        // floor(h.x * 4) gives 0,1,2,3 -> multiply by PI/2
        const float HALF_PI = 1.57079632679;
        float a0 = floor(h0.x * 4.0) * HALF_PI;
        float a1 = floor(h1.x * 4.0) * HALF_PI;
        float a2 = floor(h2.x * 4.0) * HALF_PI;

        // Get fractional UV within tile (0-1 range for rotation center)
        vec2 uvFract = fract(uv);

        // Rotate around tile center (0.5, 0.5) + random offset
        vec2 center = vec2(0.5);
        vec2 uv0 = stochasticRotate(a0) * (uvFract - center) + center + h0;
        vec2 uv1 = stochasticRotate(a1) * (uvFract - center) + center + h1;
        vec2 uv2 = stochasticRotate(a2) * (uvFract - center) + center + h2;

        // Sample and blend
        vec4 c0 = texture2D(tex, uv0);
        vec4 c1 = texture2D(tex, uv1);
        vec4 c2 = texture2D(tex, uv2);

        vec4 result = bary.x * c0 + bary.y * c1 + bary.z * c2;

        // DEBUG: Uncomment to visualize stochastic grid cells
        // result.rgb = mix(result.rgb, vec3(bary), 0.3);

        return result;
      }
    #endif

    // Helper: overlay blend mode
    vec3 overlayBlend(vec3 base, vec3 overlay) {
      vec3 result;
      result.r = base.r < 0.5 ? (2.0 * base.r * overlay.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - overlay.r));
      result.g = base.g < 0.5 ? (2.0 * base.g * overlay.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - overlay.g));
      result.b = base.b < 0.5 ? (2.0 * base.b * overlay.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - overlay.b));
      return result;
    }
  #endif
`;

export const terrainFragmentMain = /* glsl */ `
  #ifdef USE_PHOTO_TEXTURE
    vec4 blendedColor = texture2D(uPhotoTexture, vTerrainUv);
  #else
    // Sample splat map
    vec4 splat = texture2D(uSplatMap, vTerrainUv);

    // Normalize splat weights
    float totalWeight = splat.r + splat.g + splat.b + splat.a;
    if (totalWeight > 0.0) {
      splat /= totalWeight;
    } else {
      splat = vec4(1.0, 0.0, 0.0, 0.0);
    }

    // Calculate tiled UVs
    vec2 tiledUv = vTerrainUv * uTerrainSize / uTileScale;

    // Sample all texture layers (textures are in sRGB, need to decode to linear)
    #ifdef USE_STOCHASTIC_TILING
      vec4 color0 = textureStochastic(uTexture0, tiledUv);
      vec4 color1 = textureStochastic(uTexture1, tiledUv);
      vec4 color2 = textureStochastic(uTexture2, tiledUv);
      vec4 color3 = textureStochastic(uTexture3, tiledUv);
    #else
      vec4 color0 = texture2D(uTexture0, tiledUv);
      vec4 color1 = texture2D(uTexture1, tiledUv);
      vec4 color2 = texture2D(uTexture2, tiledUv);
      vec4 color3 = texture2D(uTexture3, tiledUv);
    #endif

    #ifdef USE_DETAIL_MAPS
      // Sample detail maps with per-layer tiling and fade
      float fade0 = calcDetailFade(vViewDistance, uDetailSettings0.z, uDetailSettings0.w);
      float fade1 = calcDetailFade(vViewDistance, uDetailSettings1.z, uDetailSettings1.w);
      float fade2 = calcDetailFade(vViewDistance, uDetailSettings2.z, uDetailSettings2.w);
      float fade3 = calcDetailFade(vViewDistance, uDetailSettings3.z, uDetailSettings3.w);

      if (fade0 > 0.0 && uDetailSettings0.y > 0.0) {
        vec2 detailUv0 = vTerrainUv * uTerrainSize / uDetailSettings0.x;
        #ifdef USE_STOCHASTIC_TILING
          vec4 detail0 = textureStochastic(uDetail0, detailUv0);
        #else
          vec4 detail0 = texture2D(uDetail0, detailUv0);
        #endif
        color0.rgb = mix(color0.rgb, color0.rgb * detail0.rgb * 2.0, uDetailSettings0.y * fade0);
      }
      if (fade1 > 0.0 && uDetailSettings1.y > 0.0) {
        vec2 detailUv1 = vTerrainUv * uTerrainSize / uDetailSettings1.x;
        #ifdef USE_STOCHASTIC_TILING
          vec4 detail1 = textureStochastic(uDetail1, detailUv1);
        #else
          vec4 detail1 = texture2D(uDetail1, detailUv1);
        #endif
        color1.rgb = mix(color1.rgb, color1.rgb * detail1.rgb * 2.0, uDetailSettings1.y * fade1);
      }
      if (fade2 > 0.0 && uDetailSettings2.y > 0.0) {
        vec2 detailUv2 = vTerrainUv * uTerrainSize / uDetailSettings2.x;
        #ifdef USE_STOCHASTIC_TILING
          vec4 detail2 = textureStochastic(uDetail2, detailUv2);
        #else
          vec4 detail2 = texture2D(uDetail2, detailUv2);
        #endif
        color2.rgb = mix(color2.rgb, color2.rgb * detail2.rgb * 2.0, uDetailSettings2.y * fade2);
      }
      if (fade3 > 0.0 && uDetailSettings3.y > 0.0) {
        vec2 detailUv3 = vTerrainUv * uTerrainSize / uDetailSettings3.x;
        #ifdef USE_STOCHASTIC_TILING
          vec4 detail3 = textureStochastic(uDetail3, detailUv3);
        #else
          vec4 detail3 = texture2D(uDetail3, detailUv3);
        #endif
        color3.rgb = mix(color3.rgb, color3.rgb * detail3.rgb * 2.0, uDetailSettings3.y * fade3);
      }
    #endif

    // Blend colors based on splat weights
    vec4 blendedColor = color0 * splat.r + color1 * splat.g + color2 * splat.b + color3 * splat.a;

    #ifdef USE_MACRO_NOISE
      // Apply macro noise using overlay blend to break repetition
      vec2 macroUv = vTerrainUv * uTerrainSize * uMacroScale;
      float noise = texture2D(uMacroNoise, macroUv).r;
      vec3 noiseColor = vec3(noise);
      blendedColor.rgb = mix(blendedColor.rgb, overlayBlend(blendedColor.rgb, noiseColor), uMacroStrength);
    #endif
  #endif

  // Apply to diffuse color (multiply with existing diffuseColor for proper material integration)
  diffuseColor *= blendedColor;
`;
