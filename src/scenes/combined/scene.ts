import { AxesHelper,IcosahedronGeometry, BoxGeometry, BufferGeometry, ColorRepresentation, EllipseCurve, Group, Line, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PointLight, Raycaster, Scene, ShaderMaterial, SphereGeometry, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer, SRGBColorSpace, BackSide } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';


import sunTexture from '@assets/sun/8k_sun.jpg';

import mercuryTexture from '@assets/mercury/8k_mercury.jpg';
import mercuryBumpMap from '@assets/mercury/mercurybump.jpg';

import venusTexture from '@assets/venus/8k_venus_surface.jpg';
import venusBumpMap from '@assets/venus/venusbump.jpg';

import earthTexture from '@assets/earth/8k_earth_daymap.jpg';
import earthBumpMap from '@assets/earth/earthbump1k.jpg';

import marsTexture from '@assets/mars/8k_mars.jpg';
import marsBumpMap from '@assets/mars/marsbump1k.jpg';

import jupiterTexture from '@assets/jupiter/8k_jupiter.jpg';

import saturnTexture from '@assets/saturn/8k_saturn.jpg';

import uranusTexture from '@assets/uranus/2k_uranus.jpg';

import neptuneTexture from '@assets/neptune/2k_neptune.jpg';

import { solarSystemData } from "../accurate-coords/bodies";
import { Body, HelioVector, KM_PER_AU, NextPlanetApsis, SearchPlanetApsis, StateVector, Vector } from "astronomy-engine";
import { degToRad } from "three/src/math/MathUtils.js";
import { createStars, setupBloomEffect } from "../starField/createStars";
import { fetchTLEData } from "../earth-satellites/fetch-tle";
import { sgp4, twoline2satrec } from "satellite.js";

import { loadStarsFromJson } from "../starField/realStarField";

const scene = new Scene();
const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.0000000001, 20000);

const labelRenderer = new CSS2DRenderer({element: document.getElementById('canvas-overlay')!});
labelRenderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( labelRenderer.domElement );

// https://api.le-systeme-solaire.net/en/
const sunData = solarSystemData.find(x => x.id === 'soleil')!;
const mercuryData = solarSystemData.find(x => x.id === 'mercure')!;
const venusData = solarSystemData.find(x => x.id === 'venus')!;
const earthData = solarSystemData.find(x => x.id === 'terre')!;
const marsData = solarSystemData.find(x => x.id === 'mars')!;
const jupiterData = solarSystemData.find(x => x.id === 'jupiter')!;
const saturnData = solarSystemData.find(x => x.id === 'saturne')!;
const uranusData = solarSystemData.find(x => x.id === 'uranus')!;
const neptuneData = solarSystemData.find(x => x.id === 'neptune')!;

//#region create planets
function AstroVectorToThreeVector(vec: Vector| StateVector) {
    return new Vector3(vec.x, vec.z, vec.y);
}

function makeBody(body: Body, leBody: typeof solarSystemData[number], color: ColorRepresentation = 0xff00ff, texture: string, bumpMap?: string) {
    const name = leBody.englishName;
    const radius = 0.05;// leBody.meanRadius / KM_PER_AU;

    let orbit: Vector3[] = [];
    if (body !== Body.Sun) {
        // pre-calculate orbit for accurate orbit indicators
        const apsis = SearchPlanetApsis(body, new Date());
        const nextApsis = NextPlanetApsis(body, apsis);
        const nextNextApsis = NextPlanetApsis(body, nextApsis);
        const times = nextNextApsis.time.tt - apsis.time.tt;
        const n = 100;
        orbit = [...Array(n).keys()]
            .map(v => times/n*v)
            .map(v => apsis.time.AddDays(v))
            .map(v => HelioVector(body, v))
            .map(v => AstroVectorToThreeVector(v));
    }

    const tilt = -leBody.axialTilt; // degrees
    const rotation = leBody.sideralRotation; // hours for full rotation
    
    return { body, name, radius, leBody, texture, bumpMap, orbit, tilt, rotation };
}
const bodies = [
    makeBody(Body.Sun, sunData, 0xfff000, sunTexture),
    makeBody(Body.Mercury, mercuryData, 0xbf9073, mercuryTexture, mercuryBumpMap),
    makeBody(Body.Venus, venusData, 0xf3bebe, venusTexture, venusBumpMap),
    makeBody(Body.Earth, earthData, 0x66bb5c, earthTexture, earthBumpMap),
    makeBody(Body.Mars, marsData, 0xde4430, marsTexture, marsBumpMap),
    makeBody(Body.Jupiter, jupiterData, 0xf8d4bf, jupiterTexture),
    makeBody(Body.Saturn, saturnData, 0xfff39f, saturnTexture),
    makeBody(Body.Uranus, uranusData, 0x64abff, uranusTexture),
    makeBody(Body.Neptune, neptuneData, 0x3c54cf, neptuneTexture)
];

const bodies2 = bodies
    .map(b => ({...b, vec: AstroVectorToThreeVector(HelioVector(b.body, new Date('2010-06-01')))}));

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

const planetMeshName = "planet mesh" as const;
const satellitesName = "satellites" as const;
const textureLoader = new TextureLoader();
export function addPlanet(data: typeof bodies2[number]) {
    const planetGroup = new Group();
    planetGroup.position.set(data.vec.x, data.vec.y, data.vec.z);

    const geometry = new IcosahedronGeometry(1, 128);
    const material = new MeshBasicMaterial({
        map: textureLoader.load(data.texture),
    })

    const planetMesh = new Mesh(geometry, material);
    planetMesh.scale.setScalar(data.radius);
    planetMesh.rotateX(degToRad(data.tilt));
    planetMesh.name = planetMeshName;

    const axesHelper = new AxesHelper(5);
    scene.add(axesHelper);
    planetMesh.add(axesHelper);

    planetGroup.add(planetMesh);

    planetGroup.add(createPlanetLabel(data.name, () => {
        setCameraTarget(planetGroup);
    }));

    if (data.body === Body.Earth) {
        const satellites = new Group();
        const satelliteSize = 0.001;
        satellites.name = satellitesName;
        fetchTLEData('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle').then(satellitesData => {
            satellitesData?.forEach(satelliteData => {
                const satelliteGeometry = new BoxGeometry(satelliteSize, satelliteSize, satelliteSize);
                const satelliteMaterial = new MeshBasicMaterial({ color: 0xffffff });
                const satelliteCube = new Mesh(satelliteGeometry, satelliteMaterial);

                satelliteCube.userData.name = satelliteData.name;
                satelliteCube.userData.satrec = twoline2satrec(satelliteData.line1, satelliteData.line2);

                satellites.add(satelliteCube);
            })
        });

        planetMesh.add(satellites);
    }

    return planetGroup;
}

function makeOrbitLine(b: typeof bodies2[number]) {
    const material = new LineBasicMaterial( { color: 0xa9a9a9 } );
    const geometry = new BufferGeometry().setFromPoints(b.orbit);
    const line = new LineLoop(geometry, material);
    scene.add( line );
}


const stars = await loadStarsFromJson('src/scenes/starField/stars.json');
scene.add(stars);


bodies2.forEach(planetData => {
    const planet = addPlanet(planetData);
    planet.userData['body'] = planetData.body;
    planet.userData['rotation'] = planetData.rotation;
    makeOrbitLine(planetData);
    scene.add(planet);
});

//#endregion


//#region camera focus/target

const raycaster = new Raycaster();
// make sure click-release was on the same planet
let target: Object3D | undefined = undefined;
window.addEventListener('pointerdown', event => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(scene.children, false);
    target = intersects?.[0]?.object;
});
window.addEventListener('pointerup', event => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(scene.children, false);
    const obj = intersects?.[0]?.object;
    if (obj === target && !(obj instanceof LineLoop)) {
        setCameraTarget(obj);
    }
});

const controls = new OrbitControls(camera);
let cameraTarget: Object3D | undefined = undefined;
function setCameraTarget(to: Object3D) {
    cameraTarget = to;
}
function updateCameraTarget() {
    if (!cameraTarget) return;
    controls.target = cameraTarget.position.clone();
    controls.update();
}

camera.position.set(0, 3, 0);
export function cameraTestAnimLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    const composer = setupBloomEffect(renderer, scene, camera);
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.target = new Vector3(2, 0, 0);
    controls.update();
    let date = new Date();
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        date = new Date(date.getTime() + time);
        scene.children.forEach(c => {
            const body = c.userData['body'] as Body;
            if (!body) return;
            const v = HelioVector(body, date);
            // const rotatedCoords = RotateVector(rotmat, new Vector(v.x, v.y, v.z, v.t));// rotate to the ecliptic plane (by default it's at an angle)
            const vec = AstroVectorToThreeVector(v);
            c.position.set(vec.x, vec.y, vec.z);

            const mesh = c.getObjectByName(planetMeshName);
            if (!mesh) return;

            const satellites = mesh.getObjectByName(satellitesName);
            if (satellites) {
                satellites.children.forEach(satelliteElement => {
                    const positionAndVelocity = sgp4(satelliteElement.userData.satrec, v.t.ut);
                    const positionEci = positionAndVelocity.position;
                    if (!positionEci || typeof positionEci === 'boolean') return;
                    
                    const satellitePosX = positionEci.x / 6371.0;
                    const satellitePosY = positionEci.z / 6371.0;
                    const satellitePosZ = positionEci.y / 6371.0;
        
                    satelliteElement.position.set(satellitePosX, satellitePosY, satellitePosZ);
                });
            }
            
            const hoursForFullRot = c.userData['rotation'];
            if (hoursForFullRot) {
                // the sun doesn't have rotation in le system solaire data
                const hourDiff = time / (1000 * 60 * 60 * 24); // milliseconds to days
                const degs = (360 * hourDiff) / hoursForFullRot;
                mesh.rotateY(degToRad(degs));
            }
        });
        updateCameraTarget();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
};
