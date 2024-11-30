import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PointLight, Raycaster, Scene, ShaderMaterial, SphereGeometry, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';


import sunTexture from '@assets/sun/sunmap.jpg';

import mercuryTexture from '@assets/mercury/mercurymap.jpg';
import mercuryBumpMap from '@assets/mercury/mercurybump.jpg';

import venusTexture from '@assets/venus/venusmap.jpg';
import venusBumpMap from '@assets/venus/venusbump.jpg';

import earthTexture from '@assets/earth/earthmap1k.jpg';
import earthBumpMap from '@assets/earth/earthbump1k.jpg';

import marsTexture from '@assets/mars/marsmap1k.jpg';
import marsBumpMap from '@assets/mars/marsbump1k.jpg';

import jupiterTexture from '@assets/jupiter/jupitermap.jpg';

import saturnTexture from '@assets/saturn/saturnmap.jpg';

import uranusTexture from '@assets/uranus/uranusmap.jpg';

import neptuneTexture from '@assets/neptune/neptunemap.jpg';

import plutoTexture from '@assets/pluto/plutomap1k.jpg';
import plutoBumpMap from '@assets/pluto/plutobump1k.jpg';
import vertex from '@shaders/vertex.glsl';
import fragment from '@shaders/fragment.glsl';

const scene = new Scene();
const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 20000);

const labelRenderer = new CSS2DRenderer({element: document.getElementById('canvas-overlay')!});
labelRenderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( labelRenderer.domElement );




const sunGeometry = new SphereGeometry(10, 64, 64); 
const sunMaterial = new MeshStandardMaterial({
    map: new TextureLoader().load(sunTexture),
    emissive: 0xffff00, // Glow
    emissiveIntensity: 5,
});
const sun = new Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);


const sunlight = new PointLight(0xffffff, 2, 5000);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

// Planetary data: { texture, bumpMap (optional), scale, orbit radius, rotation speed, orbit speed }
const planets = [
    { name: 'Mercury', texture: mercuryTexture, bumpMap: mercuryBumpMap, scale: 0.38, orbitRadius: 20, rotationSpeed: 0.004, orbitSpeed: 0.02 },
    { name: 'Venus', texture: venusTexture, bumpMap: venusBumpMap, scale: 0.95, orbitRadius: 35, rotationSpeed: 0.002, orbitSpeed: 0.015 },
    { name: 'Earth', texture: earthTexture, bumpMap: earthBumpMap, scale: 1, orbitRadius: 50, rotationSpeed: 0.001, orbitSpeed: 0.01 },
    { name: 'Mars', texture: marsTexture, bumpMap: marsBumpMap, scale: 0.53, orbitRadius: 75, rotationSpeed: 0.0008, orbitSpeed: 0.008 },
    { name: 'Jupiter', texture: jupiterTexture, scale: 11.2, orbitRadius: 100, rotationSpeed: 0.0005, orbitSpeed: 0.006 },
    { name: 'Saturn', texture: saturnTexture, scale: 9.5, orbitRadius: 150, rotationSpeed: 0.0006, orbitSpeed: 0.005 },
    { name: 'Uranus', texture: uranusTexture, scale: 4, orbitRadius: 200, rotationSpeed: 0.0007, orbitSpeed: 0.004 },
    { name: 'Neptune', texture: neptuneTexture, scale: 3.9, orbitRadius: 250, rotationSpeed: 0.0006, orbitSpeed: 0.003 },
    { name: 'Pluto', texture: plutoTexture, bumpMap: plutoBumpMap, scale: 0.19, orbitRadius: 300, rotationSpeed: 0.0003, orbitSpeed: 0.002 }
];

export interface PlanetOptions {
    name: string;
    texture: string;
    bumpMap?: string;
    position?: { x: number; y: number; z: number };
    scale?: number;
}

const textureLoader = new TextureLoader();
export function addPlanet({ name, texture, bumpMap, position = { x: 0, y: 0, z: 0 }, scale = 1 }: PlanetOptions) {
    const planetGroup = new Group();
    planetGroup.position.set(position.x, position.y, position.z);

    const geometry = new SphereGeometry(1, 64, 64);
    const material = new ShaderMaterial({
        uniforms: {
            uTexture: { value: textureLoader.load(texture) as Texture },
            uBumpMap: { value: bumpMap ? textureLoader.load(bumpMap) : null },
            uHasBumpMap: { value: bumpMap ? 1 : 0 }
        },
        vertexShader: vertex,
        fragmentShader: fragment
    });

    const planetMesh = new Mesh(geometry, material);
    planetMesh.scale.setScalar(scale);
    planetGroup.add(planetMesh);

    planetGroup.add(createPlanetLabel(name, () => {
        controls.target = planetGroup.position.clone();
        controls.update();
    }));

    return planetGroup;
}

planets.forEach(planetData => {
    const planet = addPlanet({
        name: planetData.name,
        texture: planetData.texture,
        bumpMap: planetData.bumpMap,
        position: { x: planetData.orbitRadius, y: 0, z: 0 },
        scale: planetData.scale
    });
    planet.userData.rotationSpeed = planetData.rotationSpeed;
    planet.userData.orbitRadius = planetData.orbitRadius;
    planet.userData.orbitSpeed = planetData.orbitSpeed;
    planet.userData.angle = 0; // Initial orbit angle
    scene.add(planet);
});


function createPlanetLabel(name: string = 'earth', onclick: typeof HTMLDivElement.prototype['onclick'] = (ev) => console.log('click')) {
    const label = document.createElement('div');
    name = name.toLowerCase();
    label.className = `planet-label ${name}`;
    label.style.color = `var(--${name}-color, var(--generic-color))`;
    label.innerHTML = `
        <span class="planet-label__circle"></span>
        <span class="planet-label__label">${name}</span>
    `;
    label.addEventListener('wheel', (ev) => {
        /** block wheel scroll on the label and send it to the canvas */
        ev.preventDefault(); 
        ev.stopImmediatePropagation();
        const ev2 = new WheelEvent(ev.type, 
            { clientX: ev.clientX, clientY: ev.clientY, deltaX: ev.deltaX, deltaY: ev.deltaY });
        window.document.getElementsByTagName('canvas')?.[0].dispatchEvent(ev2);
    });
    label.onclick = onclick;
    return new CSS2DObject(label);
}

camera.position.set(3, 0, 1.5);
// camera.position.z = 0.1;
// camera.position.y = 0.05;
// camera.lookAt(new Vector3(0, 0, 0));

const raycaster = new Raycaster();
window.addEventListener('pointerup', event => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(scene.children, false);
    const obj = intersects?.[0]?.object;
    if (obj) {
        controls.target = obj.position.clone();
        controls.update();
    }
});

// const texts = [createPlanetLabel('sun'), createPlanetLabel('earth'), createPlanetLabel('mars')];

const controls = new OrbitControls(camera);
/**
 * Draws planetish things with with larger click to select spheres
 */
export function cameraTestAnimLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.target = new Vector3(2, 0, 0);
    controls.update();

    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
};
