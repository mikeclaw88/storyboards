import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMotionConfig } from '../hooks/useMotionConfig';

// Chroma key shader
const chromaKeyVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const chromaKeyFragmentShader = `
  uniform sampler2D videoTexture;
  uniform vec3 keyColor;
  uniform float threshold;
  uniform float smoothing;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(videoTexture, vUv);
    float diff = length(texColor.rgb - keyColor);
    float alpha = smoothstep(threshold - smoothing, threshold + smoothing, diff);
    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
  }
`;

interface VideoCharacterProps {
  videoPath: string;
  characterId: string;
  position?: [number, number, number];
  loop?: boolean;
  playing?: boolean;
  currentTime?: number;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
}

/**
 * Video character component with chroma key (green screen removal)
 * Renders as billboard (always faces camera)
 */
export function VideoCharacter({
  videoPath,
  characterId,
  position = [0, 0, 0],
  loop = true,
  playing = true,
  currentTime,
  onVideoRef,
}: VideoCharacterProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1, height: 1 });

  const { config } = useMotionConfig();

  // Get video config from motion config
  const videoConfig = useMemo(() => {
    return config?.video?.[characterId] || {
      offset: { x: 0, y: 0, z: 0 },
      pivot: { x: 0, y: 0 },
      scale: 1,
      chromaKey: { color: '#00ff00', threshold: 0.4, smoothing: 0.1 },
    };
  }, [config, characterId]);

  // Parse chroma key color
  const keyColor = useMemo(() => {
    const color = videoConfig.chromaKey?.color || '#00ff00';
    return new THREE.Color(color);
  }, [videoConfig.chromaKey?.color]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        videoTexture: { value: null },
        keyColor: { value: keyColor },
        threshold: { value: videoConfig.chromaKey?.threshold || 0.4 },
        smoothing: { value: videoConfig.chromaKey?.smoothing || 0.1 },
      },
      vertexShader: chromaKeyVertexShader,
      fragmentShader: chromaKeyFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [keyColor, videoConfig.chromaKey?.threshold, videoConfig.chromaKey?.smoothing]);

  // Initialize video element and texture
  useEffect(() => {
    // Reset video size when path changes to prevent stale dimensions
    setVideoSize({ width: 1, height: 1 });

    const video = document.createElement('video');
    video.src = videoPath;
    video.loop = loop;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadedmetadata', () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    });

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;

    videoRef.current = video;
    textureRef.current = texture;
    material.uniforms.videoTexture.value = texture;

    // Expose video ref to parent
    onVideoRef?.(video);

    video.load();
    if (playing) {
      video.play().catch((e) => console.log('Video autoplay blocked:', e));
    }

    return () => {
      onVideoRef?.(null);
      video.pause();
      video.src = '';
      texture.dispose();
    };
  }, [videoPath, loop, playing, material, onVideoRef]);

  // Update video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (currentTime !== undefined) {
      video.currentTime = currentTime;
    }

    if (playing && video.paused) {
      video.play().catch((e) => console.log('Video play blocked:', e));
    } else if (!playing && !video.paused) {
      video.pause();
    }
  }, [playing, currentTime]);

  // Update material uniforms when config changes
  useEffect(() => {
    material.uniforms.keyColor.value = keyColor;
    material.uniforms.threshold.value = videoConfig.chromaKey?.threshold || 0.4;
    material.uniforms.smoothing.value = videoConfig.chromaKey?.smoothing || 0.1;
  }, [material, keyColor, videoConfig.chromaKey]);

  // Calculate billboard geometry size
  const planeSize = useMemo(() => {
    const aspect = videoSize.width / videoSize.height || 1;
    const height = 2; // Base height in world units
    return { width: height * aspect, height };
  }, [videoSize]);

  // Animation frame: billboard effect + position/scale from config
  // Pivot point stays at the passed position in world space
  // Note: offset is already applied by the parent (Stage.tsx via charOffset)
  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return;

    const pivot = videoConfig.pivot || { x: 0, y: 0 };
    const scale = videoConfig.scale || 1;

    // Pivot position in world space (position already includes tee + offset from parent)
    const pivotWorldPos = new THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );

    // Scaled plane dimensions
    const scaledHalfWidth = (planeSize.width / 2) * scale;
    const scaledHalfHeight = (planeSize.height / 2) * scale;

    // Offset from pivot to video center in screen space
    // pivot.x=0.5 means pivot is right of center, so center is LEFT of pivot (-offset)
    const offsetToCenterX = -pivot.x * scaledHalfWidth;
    const offsetToCenterY = -pivot.y * scaledHalfHeight;

    // Get camera's right, up, and forward vectors in world space
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // Calculate video center position in world space
    // videoCenter = pivot + (offset to center in screen space, converted to world)
    // Add small forward offset to render in front of tee (avoid z-fighting)
    const videoCenter = pivotWorldPos.clone()
      .addScaledVector(right, offsetToCenterX)
      .addScaledVector(up, offsetToCenterY)
      .addScaledVector(forward, -0.1);

    // Position group at video center
    groupRef.current.position.copy(videoCenter);

    // Billboard: face camera
    groupRef.current.quaternion.copy(camera.quaternion);

    // Scale applied to group
    groupRef.current.scale.setScalar(scale);

    // Mesh at origin (video center is at group position)
    meshRef.current.position.set(0, 0, 0);
  });

  return (
    <group ref={groupRef} renderOrder={100}>
      <mesh ref={meshRef} material={material} renderOrder={100}>
        <planeGeometry
          key={`${planeSize.width}-${planeSize.height}`}
          args={[planeSize.width, planeSize.height]}
        />
      </mesh>
    </group>
  );
}
