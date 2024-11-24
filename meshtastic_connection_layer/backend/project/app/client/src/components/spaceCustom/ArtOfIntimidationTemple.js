import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import Torch from './Torch';
import Store from '../../Store';
import ArtOfIntimidationGodraysPass from './ArtOfIntimidationGodraysPass';


export default class ArtOfIntimidationTemple {
  constructor() {
    const { scene, camera, renderer, isMobile } = Store.getState();

    this.visible = true;

    // Define the geometry and material for the spheres
    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32); // Sphere radius of 0.5, with 32 width and height segments for smoothness
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for visibility

    const torchPosition = new THREE.Vector3(11.45, 5.4, 5.8);
    const torch2Position = new THREE.Vector3(11.2, 5.3, -5.1);

    // // Create the first sphere at the torch's position
    // const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // sphere1.position.copy(torchPosition); // Position matches the first torch
    // scene.add(sphere1); // Add the sphere to the scene

    // // Create the second sphere at the second torch's position
    // const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // sphere2.position.copy(torch2Position); // Position matches the second torch
    // scene.add(sphere2); // Add the sphere to the scene

    // torch light
    this.torch = new Torch(torchPosition);
    this.torch2 = new Torch(torch2Position);
   	
    this.modelSettings = {
      progress: 0,
      edgeWidth: 16,
      noiseScale: 10,
    };


    if (!isMobile) {
      this.godraysPass = new ArtOfIntimidationGodraysPass();
    }

    this.loadGLBModel(); 
    // this.initGUI();
  }

  loadGLBModel() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://static.mused.org/spaceshare/draco1.5.6/');

    // load a noise texture of your choosing, this is the one I'm using
    const textureLoader = new THREE.TextureLoader();
    const noiseTexture = textureLoader.load('https://static.mused.org/noise.jpg');
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    const revealVertex = /* glsl */`
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position; // Assign the local position, or use modelViewMatrix * vec4(position, 1.0) for view space position
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

    const revealFragment = /* glsl */`
        precision highp float;

        varying vec2 vUv;
        varying vec3 vPosition; 

        uniform float revealProgress;
        uniform float edgeWidth;
        uniform float noiseScale;
        uniform vec3 revealOrigin;
        uniform sampler2D noiseTexture;
        uniform sampler2D modelTexture;

        void main () {
          vec4 modelTextureColor = texture2D(modelTexture, vUv); 

          // whatever point you'd like the reveal to start from
          float dist = distance(vPosition, revealOrigin);

          // Calculate the noise factor
          vec2 noiseCoord = vUv * noiseScale; 
          float noiseFactor = texture2D(noiseTexture, noiseCoord).r;

          // Apply noise directly to the 'dist' for a noisy transition
          float noisyDist = dist + (noiseFactor) * edgeWidth;

          // scanMix uses the distorted 'noisyDist' for a transition affected by noise
          float scanMix = smoothstep(revealProgress - edgeWidth, revealProgress, noisyDist);

          // outsideMix is 1 outside the radial move, 0 inside
          float outsideMix = step(revealProgress, noisyDist);

          // Blend between the splat color and the glow color using scanMix
          // vec3 edgeColor = mix(modelTextureColor.rgb, vec3(1.0, 0.8, 0.4), scanMix);
          vec3 edgeColor = mix(csm_DiffuseColor.rgb, vec3(1.0, 0.8, 0.4), scanMix);

          // Then blend between the edge color and transparent using outsideMix
          vec4 finalColor = mix(vec4(edgeColor, 1.0), vec4(0.0, 0.0, 0.0, 0.0), outsideMix);

          // gl_FragColor = finalColor;
          csm_DiffuseColor = finalColor;
        }
      `;
    const revealMaterial = new THREE.ShaderMaterial({
      vertexShader: revealVertex,
      fragmentShader: revealFragment,
      uniforms: {
        revealOrigin: { value: new THREE.Vector3(70, -20, -15) }, 
        revealProgress: { value: this.modelSettings.progress }, 
        edgeWidth: { value: this.modelSettings.edgeWidth }, 
        noiseScale: { value: this.modelSettings.noiseScale }, 
        noiseTexture: { value: noiseTexture },
        modelTexture: { value: null },
      },
      transparent: true, 
    });

    const revealMaterialPhong = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhongMaterial,
      vertexShader: revealVertex,
      fragmentShader: revealFragment,
      uniforms: {
        revealOrigin: { value: new THREE.Vector3(70, -20, -15) }, 
        revealProgress: { value: this.modelSettings.progress }, 
        edgeWidth: { value: this.modelSettings.edgeWidth }, 
        noiseScale: { value: this.modelSettings.noiseScale }, 
        noiseTexture: { value: noiseTexture },
        modelTexture: { value: null },
      },
      transparent: true, 
    });

    this.revealMaterial = revealMaterialPhong;


    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const url = 'https://static.mused.org/aoi_gallery_joined.glb';

    let originalTexture = null;

    loader.load(url, (gltf) => {
      const model = gltf.scene;
      model.position.set(7.6, 4.21, 0); 
      model.rotation.set(0, 3.14, 0); 
      
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true; 
          object.receiveShadow = true;
          object.renderOrder = 3;
          object.material = revealMaterialPhong;
        }
      });

      this.model = model;

      Store.getState().scene.add(model); // Add the model to the scene
      this.revealModel();
    }, undefined, (error) => {
      console.error('An error happened while loading the model:', error);
    });
  }

  initGUI() {
    const gui = new GUI();

    gui.add(this.modelSettings, 'progress', 0, 500).step(1).name('Progress').onChange(this.updateModelSettings.bind(this));
    gui.add(this.modelSettings, 'edgeWidth', 0, 100).step(1).name('Edge Width').onChange(this.updateModelSettings.bind(this));
    gui.add(this.modelSettings, 'noiseScale', 0, 100).step(1).name('noiseScale').onChange(this.updateModelSettings.bind(this));
  }

  updateModelSettings () {
    this.model.traverse((object) => {
      if (object.isMesh) {
        object.material.uniforms.revealProgress.value = this.modelSettings.progress;
        object.material.uniforms.edgeWidth.value = this.modelSettings.edgeWidth;
        object.material.uniforms.noiseScale.value = this.modelSettings.noiseScale;
      }
    });
  }

  revealModel() {
    let progress = 0; // Start with a progress value of 0
    const totalTime = 10000; // Total time in milliseconds
    const endProgress = 300; // The final value of progress
    const interval = 10; // How often to update the progress (in milliseconds)
    const increment = (endProgress / totalTime) * interval; // Calculate the increment for each interval

    this.godraysPass.turnOnGodRays();

    const progressInterval = setInterval(() => {
      // Increase the progress
      progress += increment;

      this.model.traverse((object) => {
        if (object.isMesh) {

          if (object.material && object.material.uniforms && object.material.uniforms.revealProgress) {

            object.material.uniforms.revealProgress.value = progress;
          }
        }
      });

      // If the progress reaches or exceeds the end value, stop the interval
      if (progress >= endProgress) {
        clearInterval(progressInterval);
        this.model.traverse((object) => {
          if (object.material && object.material.uniforms && object.material.uniforms.revealProgress) {
            object.material.uniforms.revealProgress.value = endProgress;
          }
        });
      }
    }, interval);

    const { app } = Store.getState();
    setTimeout(() => {
      app.dollhouse.hideOccluders();
    }, 2000);

    setTimeout(() => {
      this.revealLights();
    }, 4000);

    // setTimeout(() => {
    //   app.envCube.annotationGraph.showAllAnnotations();
    // }, 100);
  }
 
  revealLights() {
    const { app } = Store.getState();

    const totalTime = 10000; // Duration of the light reveal in milliseconds
    const intervalTime = 100; // How often to update the light properties
    let elapsedTime = 0; // Track the elapsed time

    // Initial and target values for directional light position and intensity
    this.dirLightInitialPos = new THREE.Vector3(20, 4, 0); // Assuming the light starts at this position
    this.dirLightTargetPos = new THREE.Vector3(20, 8, 0); // Target position
    this.dirLightInitialIntensity = 0.2;
    this.dirLightTargetIntensity = 1;

    // Initial and target values for godrays density
    this.godraysInitialDensity = 0.001;
    this.godraysTargetDensity = 0.03;

    // Keep track of the animation progress
    this.lightAnimationProgress = 0;

    const intervalId = setInterval(() => {
      elapsedTime += intervalTime;
      const progress = elapsedTime / totalTime;

      // Linearly interpolate light properties based on progress
      this.godraysPass.dirLight.position.lerpVectors(this.dirLightInitialPos, this.dirLightTargetPos, progress);
      this.godraysPass.dirLight.intensity = THREE.MathUtils.lerp(this.dirLightInitialIntensity, this.dirLightTargetIntensity, progress);

      this.godraysPass.godraysPass.setParams({
        ...this.godraysPass.godraysSettings,
        density: THREE.MathUtils.lerp(this.godraysInitialDensity, this.godraysTargetDensity, progress),
      });

      if (progress >= 1) {
        clearInterval(intervalId); // Stop the interval when the animation is complete
      }
    }, intervalTime);
  }

  hide () {
    const { app } = Store.getState();
    if (this.model) {
        this.model.visible = false; // This makes the entire model invisible
    }
    this.godraysPass.turnOffGodRays();
    app.dollhouse.showOccluders();
  }


  update() {
    if (this.torch) {
      this.torch.update();
    }
    if (this.torch2) {
      this.torch2.update();
    }

    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;

    }
  }
}
