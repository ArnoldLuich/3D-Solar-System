import { Scene, PerspectiveCamera, WebGLRenderer, PointLight } from 'three';
import * as THREE from 'three';
import { addPlanet } from './addPlanet';
import { TextureLoader, MeshStandardMaterial, SphereGeometry, Mesh } from 'three';

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

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

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


planets.forEach(planetData => {
    const planet = addPlanet({
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

camera.position.z = 500;

window.addEventListener('wheel', (event) => {
    const zoomSpeed = 20;
    camera.position.z += event.deltaY * 0.01 * zoomSpeed;
    camera.position.z = Math.max(100, Math.min(camera.position.z, 1500));
});

export function basicPlanetsSetupAnimationLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        scene.children.forEach(obj => {
            if (obj.userData.rotationSpeed) {
                obj.rotation.y += obj.userData.rotationSpeed;
                // Orbit around the Sun
                obj.userData.angle += obj.userData.orbitSpeed;
                obj.position.x = obj.userData.orbitRadius * Math.cos(obj.userData.angle);
                obj.position.z = obj.userData.orbitRadius * Math.sin(obj.userData.angle);
            }
        });
    
        renderer.render(scene, camera);
    };
};
