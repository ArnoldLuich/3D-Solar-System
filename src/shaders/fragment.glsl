uniform sampler2D uTexture;
uniform sampler2D uBumpMap;
uniform int uHasBumpMap;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(uTexture, vUv);
    float brightness = 1.0;
    // If a bump map exists
    if (uHasBumpMap == 1) {
        vec4 bump = texture2D(uBumpMap, vUv);
        float bumpScale = 0.9999; // Adjust this value to increase or decrease the effect
        brightness = 0.99 + (bump.r - 0.5) * bumpScale;
    }
    gl_FragColor = vec4(color.rgb * brightness, color.a);
}
