import { BaryState, Body, EclipseEvent, GeoVector, HelioVector, KM_PER_AU, RotateVector, Rotation_EQJ_ECT, StateVector, Vector } from "astronomy-engine";
import { AxesHelper, BufferGeometry, ColorRepresentation, DoubleSide, EllipseCurve, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { clamp, degToRad, radToDeg } from "three/src/math/MathUtils.js";
import { solarSystemData } from "./bodies";

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

function makeBody(body: Body, leBody: typeof solarSystemData[number], color: ColorRepresentation = 0xff00ff) {
    const name = leBody.englishName;
    const radius = 0.05;// leBody.meanRadius / KM_PER_AU;
    const sideralRotation = leBody.sideralRotation;
    const semimajorAxis = leBody.semimajorAxis / KM_PER_AU;
    const eccentricity = leBody.eccentricity;
    const semiMinorAxis = semimajorAxis * Math.sqrt(1 - eccentricity**2);
    const inclination = leBody.inclination; // angle deg from the ecliptic plane
    const longAscNode = leBody.longAscNode;
    const axialTilt = leBody.axialTilt;
    const argPeriapsis = leBody.argPeriapsis;
    const perihelion = leBody.perihelion / KM_PER_AU;
    const aphelion = leBody.aphelion / KM_PER_AU;
    return { body, name, radius, sideralRotation, color, semimajorAxis, 
        semiMinorAxis, inclination, longAscNode, axialTilt, argPeriapsis,
        perihelion, aphelion };
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

const bodies2 = bodies
    .map(b => ({...b, vec: AstroVectorToThreeVector(HelioVector(b.body, new Date('2010-06-01')))}));
// console.log(bodies2);
// console.log(bodies2.map(x => x.vec))

const VtoV3 = (v: Vector) => new Vector3(v.x, v.z, v.y);
const J2000 = new Date('2000-01-01T12:00:00Z');



const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

function AstroVectorToThreeVector(vec: Vector| StateVector) {
    return new Vector3(vec.x, vec.z, vec.y);
}

function makePlane(b: typeof bodies2[number]) {
    const geometry = new PlaneGeometry(5, 5, 1, 1);
    geometry.rotateX(degToRad(90));
    const material = new MeshBasicMaterial({color: 0xaafffa, transparent: true, opacity: 0.8, side: DoubleSide});
    const plane = new Mesh(geometry, material);
    plane.rotateY(degToRad(360-b.longAscNode));
    plane.rotateX(-degToRad(b.inclination));
    scene.add(plane);
    console.log(b);
}

// find orbital ellipses based (not accurate)
function makeEllipse(b: typeof bodies2[number]) {
    console.log(b);
    const curve = new EllipseCurve(0, 0, b.semiMinorAxis, b.semimajorAxis);
    const points = curve.getPoints(50);
    const geometry = new BufferGeometry().setFromPoints(points);
    geometry.rotateX(degToRad(90));
    const material = new LineBasicMaterial({ color: 0xfafafa });
    const plane = new Line(geometry, material);
    
    plane.rotateY(degToRad(360-b.longAscNode));
    plane.rotateX(-degToRad(b.inclination));
    const shift = b.semimajorAxis-b.aphelion;
    plane.translateX(shift);
    scene.add(plane);
}
const axesHelper = new AxesHelper(1);
scene.add( axesHelper );

bodies2.forEach(b => {
    const geometry = new SphereGeometry(b.radius, 32, 16); 
    const material = new MeshBasicMaterial({ color: b.color }); 
    const sphere = new Mesh(geometry, material);
    sphere.position.set(b.vec.x, b.vec.y, b.vec.z);
    sphere.userData['body'] = b.body;
    scene.add(sphere);
    makeEllipse(b);
});


camera.position.set(0, 3, 0);
// camera.position.z = 0.1;
// camera.position.y = 0.05;
camera.lookAt(new Vector3(0, 0, 0));
let selectedBody = bodies2[0];

function viewBody(body: typeof bodies2[number]) {
    const pos = new Vector3(body.vec.x, body.vec.y, body.vec.z);
    const newCameraPos = pos.clone()
        .normalize()
        .multiplyScalar(body.radius*10)
        .add(new Vector3(0, body.radius * 3, 0))
        .add(pos);
    camera.position.set(newCameraPos.x, newCameraPos.y, newCameraPos.z);
    camera.lookAt(pos);
}

export function accurateSetupTestAnimationLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    let date = new Date();
    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        date.setHours(date.getHours() + 5);
        scene.children.forEach(c => {
            const body = c.userData['body'];
            if (body) {
                // rotate to the ecliptic plane
                const rotmat = Rotation_EQJ_ECT(J2000);
                const rotatedCoords = RotateVector(rotmat, HelioVector(body, date));
                const vec = AstroVectorToThreeVector(rotatedCoords);
                c.position.set(vec.x, vec.y, vec.z);
            }
        });
        renderer.render(scene, camera);
    };
};
