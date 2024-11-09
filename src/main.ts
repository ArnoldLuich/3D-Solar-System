import { WebGLRenderer } from 'three';
import { setupAnimationLoop as basicPlanets } from './scenes/basic-planets/scene';

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(basicPlanets(renderer));
document.body.appendChild(renderer.domElement);
