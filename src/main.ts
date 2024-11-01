import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, ShaderMaterial, Mesh, SphereGeometry, TextureLoader } from 'three';
import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import image from './assets/image.png';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const geometry = new SphereGeometry(1, 32, 32);
// const material = new MeshBasicMaterial( { color: 0x00ff00 } );
const textureLoader = new TextureLoader();
const texture = textureLoader.load(image);
const material = new ShaderMaterial(
	{
		uniforms: {
			uTexture: {
				value: texture
			}
		},
		vertexShader: vertex,
		fragmentShader: fragment
	});

const cube = new Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render(scene, camera);
}