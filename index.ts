import * as THREE from "three";

// Set up the scene, camera, and renderer with type annotations
const w: number = window.innerWidth;
const h: number = window.innerHeight;

const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Add light
const sunLight: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sunLight);

// Create a sphere and add it to the scene
const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(1, 32, 32); // Radius, width segments, height segments
const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const sphere: THREE.Mesh = new THREE.Mesh(geometry, material);
scene.add(sphere);

function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
