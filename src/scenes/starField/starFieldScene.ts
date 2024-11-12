import { Scene, PerspectiveCamera, WebGLRenderer} from 'three';
import * as THREE from 'three';
import {createStars} from './createStars';
import { setupBloomEffect } from './createStars';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const stars = createStars({ count: 2000 });
scene.add(stars);

// Set up the bloom effect
const composer = setupBloomEffect(renderer, scene, camera);

camera.position.z = 500;

window.addEventListener('wheel', (event) => {
    const zoomSpeed = 20;
    camera.position.z += event.deltaY * 0.01 * zoomSpeed;
    camera.position.z = Math.max(100, Math.min(camera.position.z, 1500));
});

export function basicStarsSetupAnimationLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        composer.render();
        renderer.render(scene, camera);
    };
};
