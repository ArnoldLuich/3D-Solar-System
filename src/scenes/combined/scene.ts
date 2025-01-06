import { AxesHelper, DoubleSide,MathUtils, PCFSoftShadowMap, IcosahedronGeometry,RingGeometry, RepeatWrapping ,BoxGeometry, BufferGeometry, ColorRepresentation, Group, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Raycaster, Scene, TextureLoader, Vector2, Vector3, WebGLRenderer, SphereGeometry, MeshPhongMaterial, DirectionalLight, AmbientLight, PointLight, Color, Euler} from "three";
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

import saturnringcolor from '@assets/saturn/saturnringcolor.jpg';
import saturnringpattern from '@assets/saturn/saturnringpattern.gif';

import uranusringcolour from '@assets/uranus/uranusringcolour.jpg';
import uranusringtrans from '@assets/uranus/uranusringtrans.gif';

import { solarSystemData } from "../accurate-coords/bodies";
import { AxisInfo, Body, HelioVector, KM_PER_AU, NextPlanetApsis, RotationAxis, SearchPlanetApsis, StateVector, Vector } from "astronomy-engine";
import { degToRad } from "three/src/math/MathUtils.js";
import { setupBloomEffect } from "../starField/createStars";
import { fetchTLEData } from "../earth-satellites/fetch-tle";
import satellitesTle from "../earth-satellites/satellites-tle.txt?raw";
import { sgp4, twoline2satrec } from "satellite.js";

import { loadStarsFromJson } from "../starField/realStarField";
import { SceneUtils } from "three/examples/jsm/Addons.js";
import { getIsPaused, getNextDateTime, updateDateTimeLabels } from "./date-time-controls";

const scene = new Scene();
const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.000001, 5000);

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
console.log(earthData.moons);

//#region create planets
function AstroVectorToThreeVector(vec: Vector| StateVector) {
    return new Vector3(vec.x, vec.z, vec.y);
}

function makeBody(body: Body, leBody: typeof solarSystemData[number], color: ColorRepresentation = 0xff00ff, texture: string, bumpMap?: string) {
    const name = leBody.englishName;
    const radius = leBody.meanRadius / KM_PER_AU;

    let orbit: Vector3[] = [];
    if (body !== Body.Sun) {
        // pre-calculate orbit for accurate orbit indicators
        const apsis = SearchPlanetApsis(body, new Date());
        const nextApsis = NextPlanetApsis(body, apsis);
        const nextNextApsis = NextPlanetApsis(body, nextApsis);
        const times = nextNextApsis.time.tt - apsis.time.tt;
        const n = 1000;
        orbit = [...Array(n).keys()]
            .map(v => times/n*v)
            .map(v => apsis.time.AddDays(v))
            .map(v => HelioVector(body, v))
            .map(v => AstroVectorToThreeVector(v));
    }

    const tilt = -leBody.axialTilt; // degrees
    const rotation = leBody.sideralRotation; // hours for full rotation
    
    return { body, name, radius, leBody, texture, bumpMap, orbit, tilt, rotation, color };
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

        const scrollSpeed = 15;

        const ev2 = new WheelEvent(ev.type, 
            { clientX: ev.clientX, clientY: ev.clientY, deltaX: ev.deltaX, deltaY: ev.deltaY * scrollSpeed});
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

    const planet = new Mesh(
        new IcosahedronGeometry(1, 20),
        new MeshPhongMaterial({ map: textureLoader.load(data.texture)}));

    planet.scale.setScalar(data.radius);
    planet.rotateX(degToRad(data.tilt));
    planet.name = planetMeshName;
    planet.castShadow = true;
    planet.receiveShadow = true;

    const axesHelper = new AxesHelper(5);
    scene.add(axesHelper);

    planet.add(axesHelper);
    planetGroup.add(planet);

    planetGroup.add(createPlanetLabel(data.name, () => {
        setCameraTarget(planetGroup);
    }));

    if (data.body === Body.Earth) {
        const satellites = new Group();
        const satelliteSize = 0.001;
        satellites.name = satellitesName;
        // fetchTLEData('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', true).then(satellitesData => {
        fetchTLEData(satellitesTle, false).then(satellitesData => {
        satellitesData?.forEach(satelliteData => {
                const satelliteGeometry = new BoxGeometry(satelliteSize, satelliteSize, satelliteSize);
                const satelliteMaterial = new MeshBasicMaterial({ color: 0xffffff });
                const satelliteCube = new Mesh(satelliteGeometry, satelliteMaterial);

                satelliteCube.userData.name = satelliteData.name;
                satelliteCube.userData.satrec = twoline2satrec(satelliteData.line1, satelliteData.line2);

                satellites.add(satelliteCube);
            })
        });

        planet.add(satellites);
    }
    else if (data.body === Body.Sun){
        const sunLight = new PointLight(0xffffff, 1, 0);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        // Configure Shadow Properties
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.distance = 10000;
        sunLight.decay = 0.5;

        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.bias = -0.001; // Reduce shadow acn
        
        planet.add(sunLight)

        const sunMaterial = new MeshPhongMaterial({
            map: textureLoader.load(data.texture),
            emissive: new Color(0xffff00), // Bright yellow glow
            emissiveIntensity: 1,
            emissiveMap: textureLoader.load(data.texture)
        });
        // Apply the new material to the Sun
        planet.material = sunMaterial;
    } else if (data.body === Body.Saturn){
        createPlanetRings(
            planet, 
            saturnringcolor, 
            saturnringpattern, 
            1.625, 
            3.167, 
            64, 
            5 // Tilt the ring by 5 degrees
        );
    } else if (data.body === Body.Uranus){
        createPlanetRings(
            planet, 
            uranusringcolour, 
            uranusringtrans, 
            1.218, 
            2.644, 
            64, 
            25 // Tilt the ring by 5 degrees
        );
    }

    return planetGroup;
}

function createPlanetRings(planet: Object3D, ringTexturePath: string, alphaTexturePath: string, innerRadius: number, outerRadius: number, ringSegments: number, ringTiltAngle: number): void {
    const textureLoader = new TextureLoader();
    const ringTexture = textureLoader.load(ringTexturePath); 
    const alphaTexture = textureLoader.load(alphaTexturePath); 

    ringTexture.wrapS = RepeatWrapping; 
    ringTexture.wrapT = RepeatWrapping; 
    ringTexture.repeat.set(1, 1); 

    alphaTexture.wrapS = RepeatWrapping;
    alphaTexture.wrapT = RepeatWrapping;
    alphaTexture.repeat.set(1, 1);

    const ringGeometry = new RingGeometry(innerRadius, outerRadius, ringSegments);

    const pos = ringGeometry.attributes.position;
    const uv = ringGeometry.attributes.uv;
    const v3 = new Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const radialDistance = v3.length();
        uv.setXY(i, radialDistance > (innerRadius + outerRadius) / 2 ? 0 : 1, 1);
    }
    
    uv.needsUpdate = true;

    const ringMaterial = new MeshPhongMaterial({
        map: ringTexture,
        alphaMap: alphaTexture,
        transparent: true,
        side: DoubleSide,
    });

    const ringMesh = new Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.rotation.y = MathUtils.degToRad(ringTiltAngle); // Tilt angle for the ring
    

    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;

    planet.add(ringMesh);
}

function makeOrbitLine(b: typeof bodies2[number]) {
    const material = new LineBasicMaterial( { color: b.color } );
    const geometry = new BufferGeometry().setFromPoints(b.orbit);
    const line = new LineLoop(geometry, material);
    scene.add( line );
}


const stars = await loadStarsFromJson();
scene.add(stars);




bodies2.forEach(planetData => {
    const planet = addPlanet(planetData);
    planet.name = planetData.name;
    planet.userData['body'] = planetData.body;
    planet.userData['radius'] = planetData.radius;
    makeOrbitLine(planetData);
    scene.add(planet);
});
console.log(bodies2);

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


function setCameraTarget(to: Object3D | undefined) {
    cameraTarget = to;
}

function updateCameraTarget() {
    if (!cameraTarget) return;
    controls.target = cameraTarget.position.clone();
    const cameraMinDistance = (cameraTarget.userData['radius'] ?? 0) * 1.5;
    controls.minZoom = cameraMinDistance;
    controls.minDistance = cameraMinDistance;
    controls.update();
    // console.log(controls.target.clone().sub(camera.position.clone()));
}
setCameraTarget(scene.getObjectByName('Sun'));

//#endregion


camera.position.set(0, 3, 0);
export function cameraTestAnimLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    const composer = setupBloomEffect(renderer, scene, camera);
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.target = new Vector3(2, 0, 0);
    controls.update();
    
    let date = new Date();
    let prevTime = 0;
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        const deltaTime = time - prevTime; // in milliseconds
        prevTime = time;
        date = getNextDateTime(date, deltaTime);
        updateDateTimeLabels(date);
        if (!getIsPaused()) {
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

                const rotation = RotationAxis(body, date);
                mesh.up = AstroVectorToThreeVector(rotation.north);
                mesh.setRotationFromEuler(new Euler(0, MathUtils.degToRad(rotation.spin),  0));
            });
        }
        updateCameraTarget();
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
};
