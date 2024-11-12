import { WebGLRenderer } from 'three';
import { basicPlanetsSetupAnimationLoop } from './scenes/basic-planets/scene';
import './scenes/accurate-coords/coordstest';
import { accurateSetupTestAnimationLoop } from './scenes/accurate-coords/coordstest';
import { cameraTestAnimLoop } from './scenes/camera-focus/scene';
import { basicStarsSetupAnimationLoop } from './scenes/starField/starFieldScene';

type AnimationLoop = (renderer: WebGLRenderer) => XRFrameRequestCallback;

// Ensure the animation loop never returns null
const safeAnimationLoop = (loop: (renderer: WebGLRenderer) => XRFrameRequestCallback | null): (renderer: WebGLRenderer) => XRFrameRequestCallback => {
  return (renderer: WebGLRenderer) => {
    const callback = loop(renderer);
    return callback || (() => {}); // Fallback to a no-op function if null is returned
  };
};

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// List of animation loops for the scenes
const animationLoops: AnimationLoop[] = [
  safeAnimationLoop(basicPlanetsSetupAnimationLoop),
  safeAnimationLoop(accurateSetupTestAnimationLoop),
  safeAnimationLoop(cameraTestAnimLoop),
  safeAnimationLoop(basicStarsSetupAnimationLoop)
];

let currentSceneIndex: number = 0;

function switchScene(direction: 'next' | 'prev'): void {
  // Update the scene index based on the direction
  if (direction === 'next') {
    currentSceneIndex = (currentSceneIndex + 1) % animationLoops.length; // Loop back to the first scene
  } else if (direction === 'prev') {
    currentSceneIndex = (currentSceneIndex - 1 + animationLoops.length) % animationLoops.length; // Loop to the last scene
  }

  // Set the new animation loop
  renderer.setAnimationLoop(animationLoops[currentSceneIndex](renderer));
}

renderer.setAnimationLoop(animationLoops[currentSceneIndex](renderer));

window.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.key === 'ArrowRight') {
    switchScene('next');
  } else if (event.key === 'ArrowLeft') {
    switchScene('prev');
  }
});