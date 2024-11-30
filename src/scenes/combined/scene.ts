import { BufferGeometry, ColorRepresentation, EllipseCurve, Group, Line, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PointLight, Raycaster, Scene, ShaderMaterial, SphereGeometry, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
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
import { solarSystemData } from "../accurate-coords/bodies";
import { BaryState, Body, HelioVector, KM_PER_AU, NextPlanetApsis, PlanetOrbitalPeriod, RotateVector, Rotation_EQJ_ECT, SearchPlanetApsis, StateVector, Vector } from "astronomy-engine";
import { degToRad } from "three/src/math/MathUtils.js";

const scene = new Scene();
const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 20000);

const labelRenderer = new CSS2DRenderer({element: document.getElementById('canvas-overlay')!});
labelRenderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( labelRenderer.domElement );

// const sunGeometry = new SphereGeometry(10, 64, 64); 
// const sunMaterial = new MeshStandardMaterial({
//     map: new TextureLoader().load(sunTexture),
//     emissive: 0xffff00, // Glow
//     emissiveIntensity: 5,
// });
// const sun = new Mesh(sunGeometry, sunMaterial);
// sun.position.set(0, 0, 0);
// scene.add(sun);


// const sunlight = new PointLight(0xffffff, 2, 5000);
// sunlight.position.set(0, 0, 0);
// scene.add(sunlight);


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

const VtoV3 = (v: Vector) => new Vector3(v.x, v.z, v.y);

function makeBody(body: Body, leBody: typeof solarSystemData[number], color: ColorRepresentation = 0xff00ff, texture: string, bumpMap?: string) {
    const name = leBody.englishName;
    const radius = leBody.meanRadius / KM_PER_AU;

    let orbit: Vector3[] = [];
    if (body !== Body.Sun) {
        const apsis = SearchPlanetApsis(body, new Date());
        const nextApsis = NextPlanetApsis(body, apsis);
        const nextNextApsis = NextPlanetApsis(body, nextApsis);
        const times = nextNextApsis.time.tt - apsis.time.tt;
        const n = 100;
        orbit = [...Array(n).keys()]
            .map(v => times/n*v)
            .map(v => apsis.time.AddDays(v))
            .map(v => HelioVector(body, v))
            .map(v => VtoV3(v));
    }
    
    return { body, name, radius, leBody, texture, bumpMap, orbit };
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
function AstroVectorToThreeVector(vec: Vector| StateVector) {
    return new Vector3(vec.x, vec.z, vec.y);
}
const bodies2 = bodies
    .map(b => ({...b, vec: AstroVectorToThreeVector(HelioVector(b.body, new Date('2010-06-01')))}));

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
    const material = new MeshBasicMaterial({map: textureLoader.load(texture)})

    const planetMesh = new Mesh(geometry, material);
    planetMesh.scale.setScalar(scale);
    planetGroup.add(planetMesh);

    planetGroup.add(createPlanetLabel(name, () => {
        controls.target = planetGroup.position.clone();
        controls.update();
    }));

    return planetGroup;
}

function makeEllipse(b: typeof bodies2[number]) {
    const material = new LineBasicMaterial( { color: 0xfafafa } );
    const geometry = new BufferGeometry().setFromPoints( b.orbit );
    const line = new LineLoop( geometry, material );
    scene.add( line );
}

bodies2.forEach(planetData => {
    const planet = addPlanet({
        name: planetData.name,
        texture: planetData.texture,
        bumpMap: planetData.bumpMap,
        position: planetData.vec,
        scale: 0.05//planetData.radius
    });
    planet.userData['body'] = planetData.body;
    makeEllipse(planetData);
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

camera.position.set(0, 3, 0);
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

// const J2000 = new Date('2000-01-01T12:00:00Z');
// const rotmat = Rotation_EQJ_ECT(J2000);


const controls = new OrbitControls(camera);
/**
 * Draws planetish things with with larger click to select spheres
 */
export function cameraTestAnimLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.target = new Vector3(2, 0, 0);
    controls.update();
    let date = new Date();
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        date.setHours(date.getHours() + 5);
        scene.children.forEach(c => {
            const body = c.userData['body'];
            if (body) {
                const v = HelioVector(body, date);
                // const rotatedCoords = RotateVector(rotmat, new Vector(v.x, v.y, v.z, v.t));// rotate to the ecliptic plane (by default it's at an angle)
                const vec = AstroVectorToThreeVector(v);
                c.position.set(vec.x, vec.y, vec.z);
            }
        });
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
};
