import { Scene, PerspectiveCamera, WebGLRenderer, Group } from 'three';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { addPlanet } from '../basic-planets/addPlanet';
import { fetchTLEData } from './fetch-tle';

import earthTexture from '@assets/earth/earthmap1k.jpg';
import earthBumpMap from '@assets/earth/earthbump1k.jpg';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

var infoText = document.createElement('div');
infoText.style.position = 'absolute';
infoText.style.fontSize = 25 + 'px';
infoText.style.width = 200 + 'px';
infoText.style.height = 50 + 'px';
infoText.style.backgroundColor = "black";
infoText.style.color = "white";
infoText.innerHTML = "";
infoText.style.top = 50 + 'px';
infoText.style.left = (window.innerWidth - 300) + 'px';
document.body.appendChild(infoText);

const earth = addPlanet({
    texture: earthTexture,
    bumpMap: earthBumpMap
})
scene.add(earth);

const satellites = new Group();

const satelliteSize = 0.01;
fetchTLEData('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle').then(satellitesData => {
    console.log(satellitesData);
    satellitesData?.forEach(satelliteData => {
        const satelliteGeometry = new THREE.BoxGeometry(satelliteSize, satelliteSize, satelliteSize);
        const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const satelliteCube = new THREE.Mesh(satelliteGeometry, satelliteMaterial);

        satelliteCube.userData.name = satelliteData.name;
        satelliteCube.userData.satrec = satellite.twoline2satrec(satelliteData.line1, satelliteData.line2);

        satellites.add(satelliteCube);
    })
});

scene.add(satellites);

window.addEventListener('wheel', (event) => {
    const zoomSpeed = 1;
    camera.position.z += event.deltaY * 0.01 * zoomSpeed;
    camera.position.z = Math.max(2, Math.min(camera.position.z, 10));
});

var simulationTime = 0;
var simulationSpeed = 0.05;

window.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'ArrowUp') {
        simulationSpeed += 0.01;
        simulationSpeed = Math.min(0.15, simulationSpeed);
    } else if (event.key === 'ArrowDown') {
        simulationSpeed -= 0.01;
        simulationSpeed = Math.max(-0.15, simulationSpeed);
    }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(satellites, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        infoText.innerHTML = clickedObject.userData.name;
    }
}

document.addEventListener('click', onClick, false);

export function earthSatellitesAnimationLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        simulationTime += simulationSpeed;
        satellites.children.forEach(satelliteElement => {
            const positionAndVelocity = satellite.sgp4(satelliteElement.userData.satrec, simulationTime);
            const positionEci = positionAndVelocity.position;
            
            const satellitePosX = positionEci.x / 6371.0;
            const satellitePosY = positionEci.y / 6371.0;
            const satellitePosZ = positionEci.z / 6371.0;

            satelliteElement.position.set(satellitePosX, satellitePosY, satellitePosZ);
        });
        renderer.render(scene, camera);
    }
}