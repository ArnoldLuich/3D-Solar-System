import * as THREE from "three";
// Set up the scene, camera, and renderer with type annotations
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
// Add light
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sunLight);
// Create a sphere and add it to the scene
const geometry = new THREE.SphereGeometry(1, 32, 32); // Radius, width segments, height segments
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
//# sourceMappingURL=index.js.map