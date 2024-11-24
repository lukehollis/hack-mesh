uniform float time;
varying vec2 vUv;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float factor = 10.0;
  
  mvPosition.x += cos((time / 10.0 + position.x) * factor) + (sin(time * 1.0 + position.x) * factor) / 10.0;
  mvPosition.y += sin((time / 10.0 + position.y) * factor) + (cos(time * 2.0 + position.y) * factor) / 10.0;

  float randomValue = fract(sin(dot(position, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
  float pointSize = mix(1.0, 5.0, randomValue);

  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * mvPosition;

}
