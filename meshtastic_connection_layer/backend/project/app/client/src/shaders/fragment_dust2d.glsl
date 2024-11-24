precision mediump float;

uniform vec3 color;

void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.0, 0.1, distanceFromCenter);
    alpha = 1.0;
    
    gl_FragColor = vec4(color, alpha);
}
