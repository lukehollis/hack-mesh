uniform float time;
uniform float progressSketch;
uniform float progressColor;
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


float threshold(float edge0, float edge1, float x) {
	return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}


float hash(vec3 p)  // replace this by something better
{
	p  = fract( p*0.3183099+.1 );
	p *= 17.0;
	return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

float noise( in vec3 x )
{
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);

	return mix(mix(mix( hash(i+vec3(0,0,0)),
			hash(i+vec3(1,0,0)),f.x),
			mix( hash(i+vec3(0,1,0)),
			hash(i+vec3(1,1,0)),f.x),f.y),
			mix(mix( hash(i+vec3(0,0,1)),
			hash(i+vec3(1,0,1)),f.x),
			mix( hash(i+vec3(0,1,1)),
			hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
	float fl = floor(p);
	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

void main() {
    float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
    // noises & fresnel
    float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
    float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
    // stroke 
    float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 600.);
    stroke += (smallnoise * 2.0 - 1.0);

    vec3 brownColor = vec3(33.0/255.0, 32.0/255.0, 29.0/255.0);
    vec3 strokeRGB = brownColor * stroke;

    // Let's apply light intensity only to RGB values.
    vec3 modulatedRGB = strokeRGB * (0.5 + 0.5 * float(vLightIntensity)); 

    float brightness = dot(modulatedRGB, vec3(0.299, 0.587, 0.114)); // Calculate brightness

    // Dynamic threshold based on light intensity
    float threshold = mix(0.75, 0.4, float(vLightIntensity));
    float strokeAlpha = 1.0 - step(threshold, brightness); // If brightness exceeds the threshold, make it transparent
    
    vec4 strokeColor = vec4(modulatedRGB, strokeAlpha); // Using calculated RGB with alpha

    float temp = progressSketch;
    temp += (2.0 * ttt - 1.0) * 0.2;
    float distanceFromCenter = length(vScreenSpace);
    temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
	vec4 sketchColor = mix(strokeColor, vec4(0., 0., 0., 0.), temp);

    // Get original texture color
    vec4 modelTextureColor = texture2D(imagetexture, vUv); // Assuming 'vUv' contains UV coordinates passed from vertex shader

    float temp2 = progressColor;
    temp2 += (2.0 * ttt - 1.0) * 0.2;
    float distanceFromCenter2 = length(vScreenSpace);
    temp2 = smoothstep(temp2 - 0.005, temp2, distanceFromCenter2);

    // Mix based on progressColor
    vec4 finalColor = mix(modelTextureColor, sketchColor, temp2);


    
    // Set the final color
    gl_FragColor = finalColor;

}


// this does it! just for sketch effect
// void main() {
//     float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
//     // noises & fresnel
//     float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
//     float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 600.);
//     stroke += (smallnoise * 2.0 - 1.0);

//     vec3 brownColor = vec3(33.0/255.0, 32.0/255.0, 29.0/255.0);
//     vec3 strokeRGB = brownColor * stroke;

//     // Let's apply light intensity only to RGB values.
//     vec3 modulatedRGB = strokeRGB * (0.5 + 0.5 * float(vLightIntensity)); 

//     float brightness = dot(modulatedRGB, vec3(0.299, 0.587, 0.114)); // Calculate brightness

//     // Dynamic threshold based on light intensity
//     float threshold = mix(0.75, 0.4, float(vLightIntensity));
//     float strokeAlpha = 1.0 - step(threshold, brightness); // If brightness exceeds the threshold, make it transparent
    
//     vec4 strokeColor = vec4(modulatedRGB, strokeAlpha); // Using calculated RGB with alpha

//     float temp = progress;
//     temp += (2.0 * ttt - 1.0) * 0.2;
//     float distanceFromCenter = length(vScreenSpace);
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
//     vec4 finalColor = mix(strokeColor, vec4(0., 0., 0., 0.), temp);
    
//     // Set the final color
//     gl_FragColor = finalColor;

// }


// again this kind of looks good -- with light from vertex
// void main() {
//     float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
//     // noises & fresnel
//     float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
//     float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 600.);
//     stroke += (smallnoise * 2.0 - 1.0);

//     vec3 brownColor = vec3(33.0/255.0, 32.0/255.0, 29.0/255.0);
//     vec3 strokeRGB = brownColor * stroke;

//     // Let's apply light intensity only to RGB values.
//     vec3 modulatedRGB = strokeRGB * (0.5 + 0.5 * float(vLightIntensity)); 

//     float brightness = dot(modulatedRGB, vec3(0.299, 0.587, 0.114)); // Calculate brightness

//     // Dynamic threshold based on light intensity
//     float threshold = mix(0.75, 0.4, float(vLightIntensity));
//     float strokeAlpha = 1.0 - step(threshold, brightness); // If brightness exceeds the threshold, make it transparent
    
//     vec4 strokeColor = vec4(modulatedRGB, strokeAlpha); // Using calculated RGB with alpha

//     float temp = progress;
//     temp += (2.0 * ttt - 1.0) * 0.2;
//     float distanceFromCenter = length(vScreenSpace);
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
//     vec4 finalColor = mix(strokeColor, vec4(0., 0., 0., 0.), temp);
    
//     // Set the final color
//     gl_FragColor = finalColor;

// }


    // lights
    // finalColor.rgb *= pow(float(vLightIntensity), 2.); // Modify the RGB with light intensity

// this kind of looks good: 

// void main() {
//     float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
//     // noises & fresnel
//     float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
//     float bignoise = noise(5.0 * vec3(vScreenSpace,time/4.));
//     float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 600.);
//     stroke += (smallnoise * 2.0 - 1.0); // + (bignoise * 2.0 - 1.0);

//     vec3 brownColor = vec3(23.0/255.0, 22.0/255.0, 19.0/255.0);
//     vec3 strokeRGB = brownColor * stroke;
//     float brightness = dot(strokeRGB, vec3(0.299, 0.587, 0.114)); // Calculate brightness of the stroke

//     float strokeAlpha = stroke; 
    
//     vec4 strokeColor = vec4(strokeRGB, strokeAlpha); // Using calculated RGB with alpha

//     float temp = progress;
//     temp += (2.0 * ttt - 1.0) * 0.2;
//     float distanceFromCenter = length(vScreenSpace);
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
//     vec4 finalColor = mix(strokeColor, vec4(0., 0., 0., 0.), temp);

//     // lights
//     finalColor.rgb *= pow(float(vLightIntensity), 2.); // Modify the RGB with light intensity

//     // Set the final color
//     gl_FragColor = finalColor;
// }



// void main() {
//     float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
//     // noises & fresnel
//     float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
//     float bignoise = noise(5.0 * vec3(vScreenSpace,time/4.));
//     float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 600.);
//     stroke += (smallnoise * 2.0 - 1.0); // + (bignoise * 2.0 - 1.0);
//     float strokeAlpha = stroke;
    
//     float temp = progress;
//     temp += (2.0 * ttt - 1.0) * 0.2;
//     float distanceFromCenter = length(vScreenSpace);
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
//     vec3 brownColor = vec3(53.0/255.0, 52.0/255.0, 49.0/255.0);
//     vec4 strokeColor = vec4(brownColor, strokeAlpha); // Using brown color with calculated alpha

//     vec4 finalColor = mix(strokeColor, vec4(0., 0., 0., 0.), temp);

//     // lights
// 	finalColor.rgb *= vLightIntensity;

//     // Set the final color
//     gl_FragColor = finalColor;
// }


// void main() {
//     float light = dot(vNormal, normalize(vec3(1.)));
//     float ttt = texture2D(noisetexture, 0.5 * (vScreenSpace + 1.)).r;
    
//     // noises & fresnel
//     float smallnoise = noise(500.0 * vec3(vScreenSpace,1.));
//     // float bignoise = noise(5.0 * vec3(vScreenSpace,time/4.));
//     float bignoise = noise(5.0 * vec3(vScreenSpace,1.));
//     float fresnel = 1.0 - dot(vNormal,-vViewDirection);
    
//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y) * 700.);
//     stroke += (smallnoise * 2.0 - 1.0) + (bignoise * 2.0 - 1.0);
//     stroke = 1.0 - smoothstep(1.0 * light - 0.2, 1.0 * light + 0.2, stroke) - 0.5 * fresnel;
    
//     float temp = progress;
//     temp += (2.0 * ttt - 1.0) * 0.2;
//     float distanceFromCenter = length(vScreenSpace);
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);
    
//     vec3 brownColor = vec3(53.0/255.0, 52.0/255.0, 49.0/255.0);
//     float strokeAlpha = 1.0 - smoothstep(1.0 * light - 0.2, 1.0 * light + 0.2, stroke*2.) - 0.5 * fresnel;

//     vec4 strokeColor = vec4(brownColor, strokeAlpha);


//     // Mix the colors based on temp
//     vec4 finalColor = mix(strokeColor, vec4(0.0, 0.0, 0.0, 0.0), temp);
    
//     // Set the final color
//     gl_FragColor = finalColor;
// }

// working with transparency 
// void main() {
//     float light = dot(vNormal, normalize(vec3(1.)));

//     float ttt = texture2D(noisetexture,0.5*(vScreenSpace + 1.)).r;

//     // noises & fresnel
//     float smallnoise = noise(500.*vec3(vScreenSpace,1.));
//     float bignoise = noise(5.*vec3(vScreenSpace,time/4.));
//     float fresnel = 1. - dot(vNormal,-vViewDirection);

//     // stroke 
//     float stroke = cos((vScreenSpace.x - vScreenSpace.y )*700.);
//     stroke += (smallnoise*2. - 1.) + (bignoise*2. - 1.) ;
//     stroke = 1. - smoothstep(1.*light -0.2,1.*light + 0.2, stroke) - 0.5*fresnel;

//     float alpha = smoothstep(0.3, 0.7, stroke);  // This sets alpha to 1.0 when stroke is near 0.7 and 0.0 when stroke is near 0.3. Adjust these thresholds accordingly.

//     // Depending on temp (progress), we either show the stroke or make it transparent
//     float temp = progress;
//     temp += (2.*ttt - 1.)*0.2;
//     float distanceFromCenter = length(vScreenSpace); 
//     temp = smoothstep(temp - 0.005, temp, distanceFromCenter);

//     // Mix the colors based on temp
//     vec4 finalColor = mix(vec4(vec3(stroke*0.5), alpha), vec4(0.0, 0.0, 0.0, 0.0), temp);

//     // Set the final color
//     gl_FragColor = finalColor;
// }

// this is all working vvv
// void main()	{
// 	float light = dot(vNormal, normalize(vec3(1.)));

// 	float ttt = texture2D(noisetexture,0.5*(vScreenSpace + 1.)).r;

// 	// noises & fresnel
// 	float smallnoise = noise(500.*vec3(vScreenSpace,1.));
// 	float bignoise = noise(5.*vec3(vScreenSpace,time/4.));
// 	float fresnel = 1. - dot(vNormal,-vViewDirection);


// 	// stroke 
// 	float stroke = cos((vScreenSpace.x - vScreenSpace.y )*700.);
// 	stroke += (smallnoise*2. - 1.) + (bignoise*2. - 1.) ;
// 	stroke = 1. - smoothstep(1.*light -0.2,1.*light + 0.2, stroke) - 0.5*fresnel;

//     // Sample the color from imagetexture
//     // vec4 imageColor = texture2D(imagetexture, vUv);
// 	// stroke = mix(stroke, imageColor.r, 0.5);

// 	float temp = progress;
// 	temp += (2.*ttt - 1.)*0.2;
	
// 	float distanceFromCenter = length(vScreenSpace); // on flat / screenspace appearance of the progress effect, get distance from cetner  
// 	temp = smoothstep(temp - 0.005,temp,distanceFromCenter);

// 	// Assuming stroke is a float representing the grayscale value, convert it to a vec4
// 	vec4 strokeColor = vec4(vec3(stroke), 1.0); // 1.0 alpha means fully opaque

// 	// Transparent black color
// 	vec4 transparentBlack = vec4(0.0, 0.0, 0.0, 0.0);

// 	// Mix the colors based on temp
// 	vec4 finalColor = mix(strokeColor, transparentBlack, temp);

// 	// Set the final color
// 	gl_FragColor = finalColor;

//     // // Mix the stroke with the image texture based on progress
//     // float finalLook = mix(stroke, 0., temp);

// 	// // Set the final color using the finalLook
// 	// gl_FragColor = vec4(vec3(finalLook),1.);
// 		// Calculate the final look and alpha
// 	// gl_FragColor = vec4(vec3(finalLook), 1);
// }

// void main()	{
// 	float light = dot(vNormal, normalize(vec3(1.)));

// 	float ttt = texture2D(noisetexture,0.5*(vScreenSpace + 1.)).r;

// 	// noises & fresnel
// 	float smallnoise = noise(500.*vec3(vScreenSpace,1.));
// 	float bignoise = noise(5.*vec3(vScreenSpace,time/4.));
// 	float fresnel = 1. - dot(vNormal,-vViewDirection);

//     // Sample the color from imagetexture
//     vec4 imageColor = texture2D(imagetexture, vUv);

// 	// 
// 	// stroke 
// 	// 	
// 	float stroke = cos((vScreenSpace.x - vScreenSpace.y )*700.);

// 	stroke += (smallnoise*2. - 1.) + (bignoise*2. - 1.) ;

// 	stroke = 1. - smoothstep(1.*light -0.2,1.*light + 0.2, stroke) - 0.5*fresnel;
//     stroke = mix(stroke, imageColor.r, 0.5);

// 	//	
// 	// stroke 1
// 	//	
// 	float stroke1 = cos((vScreenSpace.x - vScreenSpace.y )*700.);

// 	stroke1 += (smallnoise*2. - 1.) + (bignoise*2. - 1.) ;

// 	stroke1 = 1. - smoothstep(1.*light -0.2,1.*light + 0.2, stroke1) - 0.5*fresnel;
// 	stroke1 = 1. - smoothstep(2.*light -1.,2.*light + 1., stroke1);

// 	//	
// 	// temp / progress  
// 	//	
// 	float temp = progress;
// 	temp += (2.*ttt - 1.)*0.2;
	
// 	float distanceFromCenter = length(vScreenSpace); // on flat / screenspace appearance of the progress effect, get distance from cetner  
// 	temp = smoothstep(temp - 0.005,temp,distanceFromCenter);

    
//     // Calculate the finalLook
//     // If temp is close to 1, apply imageTexture only to stroke1
//     float finalLook = mix(stroke, stroke1, temp);
    
//     // orig
// 	gl_FragColor = vec4(vec3(finalLook),1.);


//     // Convert the color to black and white using luminance
//     // float luminance = dot(vec3(finalLook), vec3(0.299, 0.587, 0.114));
    
//     // Set the final color using the luminance
//     // gl_FragColor = vec4(vec3(luminance), 1.0);


// 	// iamge with color
//     // You might want to mix the finalLook with the imageColor in some way
//     // Here, we are just multiplying them, but you could also add them, or find some other combination
//     // gl_FragColor = vec4(imageColor.rgb * vec3(finalLook), imageColor.a);
// }