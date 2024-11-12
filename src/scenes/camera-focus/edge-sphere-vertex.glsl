varying float diff;

// colors the edge
// normals aligned to the camera turn transparent
void main() {
    vec3 p = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vec3 n = normalize(normalMatrix * normal);
    vec3 v = normalize(n - p);
    diff = 1.0 - abs(dot(v, n));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}