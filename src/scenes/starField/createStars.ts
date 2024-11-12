import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface StarGeneratorOptions {
  count?: number;
}

export function createStars({ count = 500 }: StarGeneratorOptions): THREE.Points {
  const colors = [
    0xadd8e6, // Light blue
    0xfff9b1, // Light yellow
    0xffc1c1, // Light red
    0xccffcc, // Light green
    0xffffff  // White
  ];

  const starGeometry = new THREE.BufferGeometry();
  const starPositions: number[] = [];
  const starColors: number[] = [];

  for (let i = 0; i < count; i++) {
    const position = randomPositionOnSphere();
    starPositions.push(position.x, position.y, position.z);

    const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    starColors.push(color.r, color.g, color.b);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });

  return new THREE.Points(starGeometry, starMaterial);
}

function randomPositionOnSphere(): THREE.Vector3 {
  const radius = Math.random() * 1500 + 1500;
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

export function setupBloomEffect(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): EffectComposer {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomParams = { strength: 1.5, radius: 0.1, threshold: 0.2 };
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomParams.strength,
    bloomParams.radius,
    bloomParams.threshold
  );
  
  composer.addPass(bloomPass);

  return composer;
}
