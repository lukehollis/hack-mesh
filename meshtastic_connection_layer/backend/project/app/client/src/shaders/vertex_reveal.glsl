uniform float time;
uniform vec2 pixels;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vScreenSpace;
varying vec3 vViewDirection;

float PI = 3.141592653589793238;
void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(mat3(modelMatrix)*normal);

  vec3 worldPosition = (modelMatrix*vec4( position, 1.0 )).xyz;
  vViewDirection = normalize(worldPosition - cameraPosition);

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  vScreenSpace = gl_Position.xy/gl_Position.w;

 
}