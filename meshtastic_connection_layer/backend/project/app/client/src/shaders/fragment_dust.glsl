precision mediump float;

uniform vec3 color;
uniform float time;
uniform vec3 lightPosition; // Spotlight position
uniform vec3 lightColor;    // Spotlight color
uniform float lightIntensity; // Spotlight intensity

varying float vLightFactor;

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

// Fragment Shader
void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.0, 0.2, dist);

    vec3 modulatedColor;
    float modulatedAlpha;
    
    if (vLightFactor > 0.0) {
        // Particle is in the light cone, modulate color and alpha with light
        modulatedColor = color + lightColor * vLightFactor; // Sum the color and the lightColor
        modulatedAlpha = alpha; // keep the original alpha
    } else {
        // Particle is outside of the light cone, use original color and make it darker
        modulatedColor = color * 0.5; // You can adjust the factor here for desired darkness
        modulatedAlpha = alpha;
        modulatedAlpha = modulatedAlpha - 0.3;
    }

    if (modulatedAlpha<0.0) {
        modulatedAlpha = 0.0;
    }
    // if (modulatedAlpha == 0.0) discard;

    gl_FragColor = vec4(modulatedColor, modulatedAlpha);
}
