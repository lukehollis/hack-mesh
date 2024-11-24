uniform float time;
uniform vec3 lightPosition; // Spotlight position
uniform vec3 lightTarget; // Spotlight target
uniform vec3 lightColor;    // Spotlight color
uniform float lightIntensity; // Spotlight intensity
uniform float lightAngle; // Spotlight angle

varying float vLightFactor; // Pass the calculated light factor to the fragment shader

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float factor = 100.0;
    
    mvPosition.x += cos((time / 10.0 + position.x) * factor) + (sin(time * 1.0 + position.x) * factor) / 10.0;
    mvPosition.y += sin((time / 10.0 + position.y) * factor) + (cos(time * 2.0 + position.y) * factor) / 10.0;
    mvPosition.z += cos((time / 10.0 + position.z) * factor) + (sin(time * 3.0 + position.z) * factor) / 10.0;

    float randomValue = fract(sin(dot(position, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
    float pointSize = mix(8.0, 12.0, randomValue);
    // float pointSize = mix(18.0, 22.0, randomValue);
  
    gl_PointSize = pointSize;
    gl_Position = projectionMatrix * mvPosition;

    // Transform lightPosition and lightTarget into view space
    vec3 viewLightPosition = (viewMatrix * vec4(lightPosition, 1.0)).xyz;
    vec3 viewLightTarget = (viewMatrix * vec4(lightTarget, 1.0)).xyz;
    
    // Calculate the vector from the vertex to the light source and normalize it
    vec3 lightDirection = normalize(viewLightPosition - mvPosition.xyz);
    // Calculate the direction the spotlight is facing
    vec3 spotlightDirection = normalize(viewLightTarget - viewLightPosition);
   
    
    float angleCos = cos(lightAngle);

    // if the light intensity is above zero, then factor in the light cone -- otherwise, just
    // pass normal light Factor
    if (lightIntensity > 0.0) {
      // Check if the point is within the spotlight's cone
      if (dot(-lightDirection, spotlightDirection) > angleCos) {
        // Use viewLightPosition for distance to light calculation
          float distanceToLight = length(viewLightPosition - mvPosition.xyz);
          vLightFactor = lightIntensity / (1.0 + distanceToLight * distanceToLight);

      } else {
          vLightFactor = 0.0;
      }

    } else {
          vLightFactor = 1.0;
    }

}
