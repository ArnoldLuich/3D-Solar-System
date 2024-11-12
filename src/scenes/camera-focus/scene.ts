import { Color, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Raycaster, Scene, ShaderMaterial, Sphere, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import vertexShader from './edge-sphere-vertex.glsl';
import fragmentShader from './edge-sphere-fragment.glsl';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

const circleName = 'Select circle' as const;
[0, 2, 4].forEach(b => {
    const geometry = new SphereGeometry(0.1, 32, 32); 
    const material = new MeshBasicMaterial({ color: 0x9fbb6a }); 
    const sphere = new Mesh(geometry, material);
    sphere.position.set(b, 0, 0);
    scene.add(sphere);
    {
        const material = new ShaderMaterial( {fragmentShader, vertexShader, transparent: true, uniforms: { color: {value: new Color(0xff2255) } } });
        const geometry = new SphereGeometry( 0.1, 32, 32 );
        const circle = new Mesh(geometry, material);
        circle.name = circleName;
        circle.position.set(b, 0, 0);
        scene.add(circle);
    }
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
        scene.children.forEach(object => {
            if (object.name === circleName) {
                const dist = camera.position.distanceTo(object.position);
                object.scale.setScalar(Math.max(1, dist*0.5));
            }
        });
        renderer.render(scene, camera);
    };
};
