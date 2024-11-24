uniform vec3 color;
uniform float time;
uniform sampler2D noisetexture;
uniform vec3 lightColor;
uniform vec3 lightDirection;
uniform float lightIntensity;
uniform float glitterMaskPow;
uniform float glitterMultiplier;


varying vec2 vUv;
varying vec3 vNormalWorld;

void main() {
  // vec2 adjustedUV = vec2(vUv.x, 1.0 - vUv.y);
  vec2 adjustedUV = vec2(vUv.x, 1.0 - vUv.y) * vec2(100.0, 100.0);
  float result = 0.0;

  result += texture2D(noisetexture, adjustedUV * 1.1 + (time * -0.005)).r;
  result *= texture2D(noisetexture, adjustedUV * 0.9 + (time * +0.005)).g;
  result = pow(result, glitterMaskPow);

  // Base color
  vec3 finalColor = color;
  
  // Calculate diffuse lighting
  vec3 normalizedLightDir = normalize(lightDirection);
  float diff = max(dot(vNormalWorld, normalizedLightDir), 0.0);
  vec3 diffuse = diff * lightColor * lightIntensity;
  
  // Apply lighting 
  finalColor *= diffuse;

  // Apply glitter fx
  finalColor = mix(finalColor, vec3(1.0), result*glitterMultiplier);
  gl_FragColor = vec4(finalColor, 1.0); 
}


