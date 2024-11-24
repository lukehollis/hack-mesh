uniform float time;
uniform float progressSketch;
uniform float progressReveal;
uniform sampler2D imagetexture;
uniform sampler2D noisetexture;
uniform vec4 resolution;

varying vec3 vViewDirection;
varying vec3 vLightIntensity;
varying vec2 vScreenSpace;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;


void main() {
    float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    

    // Get original texture color
    vec4 modelTextureColor = texture2D(imagetexture, vUv); // Assuming 'vUv' contains UV coordinates passed from vertex shader

    float temp2 = progressReveal;
    temp2 += (2.0 * ttt - 1.0) * 0.2;
    float distanceFromCenter2 = length(vScreenSpace);
    temp2 = smoothstep(temp2 - 0.005, temp2, distanceFromCenter2);

    // Mix based on progressReveal
    vec4 finalColor = mix(modelTextureColor, vec4(0.0), temp2);


    
    // Set the final color
    gl_FragColor = finalColor;

}

