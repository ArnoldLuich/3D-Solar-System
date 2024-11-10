import { WebGLRenderer } from 'three';
import { basicPlanetsSetupAnimationLoop } from './scenes/basic-planets/scene';
import './scenes/accurate-coords/coordstest';
import { accurateSetupTestAnimationLoop } from './scenes/accurate-coords/coordstest';

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(basicPlanetsSetupAnimationLoop(renderer));
// renderer.setAnimationLoop(accurateSetupTestAnimationLoop(renderer));
document.body.appendChild(renderer.domElement);
