import { Group, SphereGeometry, ShaderMaterial, Mesh, TextureLoader, Texture } from 'three';
import vertex from '../../shaders/vertex.glsl';
import fragment from '../../shaders/fragment.glsl';

const textureLoader = new TextureLoader();

export interface PlanetOptions {
    texture: string;
    bumpMap?: string;
    position?: { x: number; y: number; z: number };
    scale?: number;
}

export function addPlanet({ texture, bumpMap, position = { x: 0, y: 0, z: 0 }, scale = 1 }: PlanetOptions) {
    const planetGroup = new Group();
    planetGroup.position.set(position.x, position.y, position.z);

    const geometry = new SphereGeometry(1, 64, 64);
    const material = new ShaderMaterial({
        uniforms: {
            uTexture: { value: textureLoader.load(texture) as Texture },
            uBumpMap: { value: bumpMap ? textureLoader.load(bumpMap) : null },
            uHasBumpMap: { value: bumpMap ? 1 : 0 }
        },
        vertexShader: vertex,
        fragmentShader: fragment
    });

    const planetMesh = new Mesh(geometry, material);
    planetMesh.scale.setScalar(scale);
    planetGroup.add(planetMesh);

    return planetGroup;
}