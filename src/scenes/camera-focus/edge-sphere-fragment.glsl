varying float diff;
uniform vec3 color;

// colors the edge
void main() {
    gl_FragColor = vec4(color, 1.0 * diff);
}