import { WebGLRenderer } from 'three';
import { basicPlanetsSetupAnimationLoop } from './scenes/basic-planets/scene';
import { accurateSetupTestAnimationLoop } from './scenes/accurate-coords/coordstest';
import { cameraTestAnimLoop } from './scenes/camera-focus/scene';

export const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(basicPlanetsSetupAnimationLoop(renderer));
// renderer.setAnimationLoop(accurateSetupTestAnimationLoop(renderer));
// renderer.setAnimationLoop(cameraTestAnimLoop(renderer));
document.body.appendChild(renderer.domElement);
