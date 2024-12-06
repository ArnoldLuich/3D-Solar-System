import * as THREE from 'three';
import starJson from './stars.json?raw';

const starMaterial = new THREE.PointsMaterial({
    size: 1, // Default size; will scale based on magnitude later
    color: 0xffffff,
    transparent: true,
});

// Function to convert RA/Dec to Cartesian coordinates
function sphericalToCartesian(ra: number, dec: number): [number, number, number] {
    const raRad = THREE.MathUtils.degToRad(ra); // Convert RA to radians
    const decRad = THREE.MathUtils.degToRad(dec); // Convert Dec to radians

    // Use a fixed distance for all stars, since distance is not provided
    const distance = 5000; 

    const x = distance * Math.cos(decRad) * Math.cos(raRad);
    const y = distance * Math.cos(decRad) * Math.sin(raRad);
    const z = distance * Math.sin(decRad);

    return [x, y, z];
}

// Function to load stars from the JSON file and return the `THREE.Points` object
export async function loadStarsFromJson(): Promise<THREE.Points> {
    try {
        // const response = await fetch(filePath);
        // if (!response.ok) {
        //     throw new Error(`Failed to fetch star data: ${response.statusText}`);
        // }

        const starData: Array<{ name: string; ra: number; dec: number; magnitude: number }> = JSON.parse(starJson);

        const positions: number[] = [];
        const sizes: number[] = [];

        for (const star of starData) {
            const { ra, dec, magnitude } = star;
            const [x, y, z] = sphericalToCartesian(ra, dec);

            positions.push(x, y, z);
            sizes.push(Math.max(1, 5 - magnitude)); // Scale size inversely to magnitude
        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const stars = new THREE.Points(starGeometry, starMaterial);
        return stars;
    } catch (error) {
        console.error("Error loading star data:", error);
        throw error; // Propagate the error so the caller can handle it
    }
}
