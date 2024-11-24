varying vec2 vUv;
varying vec3 vNormalWorld;

void main() {
  vUv = uv;
  vNormalWorld = normalize(mat3(modelMatrix) * normal); // Transform the normal to view space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

