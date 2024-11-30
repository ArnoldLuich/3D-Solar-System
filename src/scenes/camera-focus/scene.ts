import { Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const scene = new Scene();
const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 20000);

const labelRenderer = new CSS2DRenderer({element: document.getElementById('canvas-overlay')!});
labelRenderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( labelRenderer.domElement );

function createPlanetLabel(name: string = 'earth', onclick: typeof HTMLDivElement.prototype['onclick'] = (ev) => console.log('click')) {
    const label = document.createElement('div');
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
    return label;
}

const circleName = 'Select circle' as const;
([[0, 'sun'], [2, 'earth'], [4, 'mars']] as const).forEach(b => {
    const geometry = new SphereGeometry(0.1, 32, 32); 
    const material = new MeshBasicMaterial({ color: 0x9fbb6a }); 
    const sphere = new Mesh(geometry, material);
    sphere.position.set(b[0], 0, 0);
    sphere.name = circleName;

    const div = createPlanetLabel(b[1], (ev) => {
        controls.target = sphere.position.clone();
        controls.update();
    });
    const label = new CSS2DObject(div);
    label.layers.set(0);
    sphere.add(label);
    sphere.layers.enableAll();
    scene.add(sphere);
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

// const texts = [createPlanetLabel('sun'), createPlanetLabel('earth'), createPlanetLabel('mars')];

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
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
};
