import { Body, HelioVector, KM_PER_AU } from "astronomy-engine";
import { ColorRepresentation, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { clamp } from "three/src/math/MathUtils.js";

// https://api.le-systeme-solaire.net/en/
const sunData = { id: "soleil", englishName: "Sun", meanRadius: 695508, sideralRotation: 0 };
const mercuryData = { id: "mercure", englishName: "Mercury", meanRadius: 2439.4, sideralRotation: 1407.6 };
const venusData = { id: "venus", englishName: "Venus", meanRadius: 6051.8, sideralRotation: -5832.5 };
const earthData = { id: "terre", englishName: "Earth", meanRadius: 6371.0084, sideralRotation: 23.9345 };
const marsData = { id: "mars", englishName: "Mars", meanRadius: 3389.5, sideralRotation: 24.6229 };
const jupiterData = { id: "jupiter", englishName: "Jupiter", meanRadius: 69911, sideralRotation: 9.925 };
const saturnData = { id: "saturne", englishName: "Saturn", meanRadius: 58232, sideralRotation: 10.656 };
const uranusData = { id: "uranus", englishName: "Uranus", meanRadius: 25362, sideralRotation: -17.24 };
const neptuneData = { id: "neptune", englishName: "Neptune", meanRadius: 24622, sideralRotation: 16.11 };

interface LeBody {
    id: string,
    englishName: string,
    meanRadius: number,
    sideralRotation: number
}

function makeBody(body: Body, leBody: LeBody, color: ColorRepresentation = 0xff00ff) {
    const name = leBody.englishName;
    const radius = leBody.meanRadius / KM_PER_AU;
    const sideralRotation = leBody.sideralRotation;
    return { body, name, radius, sideralRotation, color };
}
const bodies = [
    makeBody(Body.Sun, sunData, 0xfff000),
    makeBody(Body.Mercury, mercuryData, 0xbf9073),
    makeBody(Body.Venus, venusData, 0xf3bebe),
    makeBody(Body.Earth, earthData, 0x66bb5c),
    makeBody(Body.Mars, marsData, 0xde4430),
    makeBody(Body.Jupiter, jupiterData, 0xf8d4bf),
    makeBody(Body.Saturn, saturnData, 0xfff39f),
    makeBody(Body.Uranus, uranusData, 0x64abff),
    makeBody(Body.Neptune, neptuneData, 0x3c54cf)
];

const maxRadius = Math.max(...bodies.map(b => b.radius));
const bodies2 = bodies.map(b => ({...b, radius: b.radius / maxRadius })).map(b => ({...b, vec: HelioVector(b.body, new Date())}));
console.log(bodies2);
console.log(bodies2.map(b => HelioVector(b.body, new Date())))


const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

console.log('as');
console.log(HelioVector(Body.Sun, new Date()));
console.log(HelioVector(Body.Mercury, new Date()));


bodies2.forEach(b => {
    const geometry = new SphereGeometry(b.radius, 32, 16); 
    const material = new MeshBasicMaterial({ color: b.color }); 
    const sphere = new Mesh(geometry, material);
    sphere.position.set(b.vec.x, b.vec.y, b.vec.z);
    sphere.userData['body'] = b.body;
    scene.add(sphere);
});



camera.position.z = 15;
camera.position.y = -15;
camera.lookAt(new Vector3(0, 0, 0));
let selectedBody = bodies2[0];
window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft') {
        let idx = bodies2.indexOf(selectedBody) - 1;
        idx = idx < 0 ? bodies2.length - 1 : idx;
        selectedBody = bodies2[idx];
    } else if (event.key === 'ArrowRight') {
        let idx = bodies2.indexOf(selectedBody) + 1;
        idx = idx > bodies2.length - 1 ? 0 : idx;
        selectedBody = bodies2[idx];
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        console.log(event, selectedBody);
        const activeChild = scene.children.find(x => x.userData['body'] === selectedBody.body);
        if (activeChild) {
            const pos = activeChild.position;
            camera.lookAt(pos);
        }
    }
});
window.addEventListener('wheel', (event) => {
    const zoomSpeed = 0.1;
    camera.position.z += event.deltaY * 0.01 * zoomSpeed;
    camera.position.z = clamp(camera.position.z, 0.5, 30);
    camera.position.y += event.deltaY * 0.01 * -zoomSpeed;
    camera.position.y = clamp(camera.position.y, -30, -0.5);
    const activeChild = scene.children.find(x => x.userData['body'] === selectedBody.body);
    if (activeChild) {
        const pos = activeChild.position;
        camera.lookAt(pos);
    }
    console.log(camera.position);
});

export function accurateSetupTestAnimationLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    let date = new Date();
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        date.setHours(date.getHours() + 2);
        scene.children.forEach(c => {
            const body = c.userData['body'];
            if (body) {
                const vec = HelioVector(body, date);
                c.position.set(vec.x, vec.y, vec.z);
            }
        });

    
        renderer.render(scene, camera);
    };
};
