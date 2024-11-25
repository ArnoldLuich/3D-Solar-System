import { Camera, Color, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Raycaster, Scene, ShaderMaterial, Sphere, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import vertexShader from './edge-sphere-vertex.glsl';
import fragmentShader from './edge-sphere-fragment.glsl';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

const posOnScreen = (obj: Object3D, canvas: HTMLCanvasElement, camera: Camera) => {
    const pos = obj.getWorldPosition(new Vector3()).project(camera);
    const rect = canvas.getBoundingClientRect();
    const x = (0.5 + pos.x / 2) * (rect.width);
    const y = (0.5 - pos.y / 2) * (rect.height);
    return new Vector2(x, y);
};

function createPlanetLabel(planet: string = 'earth') {
    const label = document.createElement('div');
    label.className = `planet-label ${planet}`;
    label.style.color = `var(--${planet}-color, var(--generic-color))`;
    label.innerHTML = `
        <div class="planet-label__container">
            <span class="planet-label__circle"></span>
            <span class="planet-label__label">${planet}</span>
        </div>
    `;
    label.addEventListener('wheel', (ev) => {
        /** block wheel scroll on the label and send it to the canvas */
        ev.preventDefault(); 
        ev.stopImmediatePropagation();
        const ev2 = new WheelEvent(ev.type, 
            { clientX: ev.clientX, clientY: ev.clientY, deltaX: ev.deltaX, deltaY: ev.deltaY });
        window.document.getElementsByTagName('canvas')?.[0].dispatchEvent(ev2);
    });
    label.onmouseup = (ev) => console.log('click');
    document.getElementById('canvas-overlay')?.appendChild(label);
    return label;
}

const circleName = 'Select circle' as const;
[0, 2, 4].forEach(b => {
    const geometry = new SphereGeometry(0.1, 32, 32); 
    const material = new MeshBasicMaterial({ color: 0x9fbb6a }); 
    const sphere = new Mesh(geometry, material);
    sphere.position.set(b, 0, 0);
    sphere.name = circleName;
    scene.add(sphere);
    // {
    //     const material = new ShaderMaterial( {fragmentShader, vertexShader, transparent: true, uniforms: { color: {value: new Color(0xff2255) } } });
    //     const geometry = new SphereGeometry( 0.1, 32, 32 );
    //     const circle = new Mesh(geometry, material);
    //     circle.name = circleName;
    //     circle.position.set(b, 0, 0);
    //     scene.add(circle);
    // }
});

camera.position.set(3, 0, 1.5);
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

const texts = [createPlanetLabel('sun'), createPlanetLabel('earth'), createPlanetLabel('mars')];

const controls = new OrbitControls(camera);
/**
 * Draws planetish things with with larger click to select spheres
 */
export function cameraTestAnimLoop(renderer: WebGLRenderer): XRFrameRequestCallback | null {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.target = new Vector3(2, 0, 0);
    controls.update();

    return (time: DOMHighResTimeStamp, frame: XRFrame) => {
        let idx = 0;
        scene.children.forEach(object => {
            if (object.name === circleName) {
                // const dist = camera.position.distanceTo(object.position);
                // object.scale.setScalar(Math.max(1, dist*0.5));
                const pos = posOnScreen(object, renderer.domElement, camera);
                texts[idx].style.transform = `translate(${pos.x}px, ${pos.y}px)`;
                idx += 1;
            }
        });
        renderer.render(scene, camera);
    };
};
