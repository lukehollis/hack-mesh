import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import { Sky } from 'three/addons/objects/Sky';
import Stars from './Stars';

import fragment from "../shaders/fragment_sandglitter.glsl";
import vertex from "../shaders/vertex_sandglitter.glsl";

import Store from '../Store';


export default class CutsceneBackground {
  constructor() {
    const { scene } = Store.getState();

    this.loader = new GLTFLoader(); 


    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://static.mused.org/spaceshare/draco1.5.6/'); // Adjust this path to where your Draco scripts are located

    // Attach DracoLoader instance to GLTFLoader
    this.loader.setDRACOLoader(dracoLoader);

    this.time = 0;
    this.terrain = null;
    this.sky = null;
    this.sun = null;
    this.transitionState = null;

    this.loader.load("https://static.mused.org/dunes_uvs.glb", this.handleLoadTerrain.bind(this));

    // settings for sunset to night 
    this.effectControllerSunset = {
      turbidity: 1.5,
      rayleigh: 3,
      mieCoefficient: 0.0005,
      mieDirectionalG: 0.7,
      elevation: 4,
      azimuth: 180,
      exposure: 0.5, 
    };

    // settings for night
    this.effectControllerNight = {
      turbidity: 0.2,
      rayleigh: 0.2,
      mieCoefficient: 0.01,
      mieDirectionalG: 0.8,
      elevation: -2,
      azimuth: 180,
      exposure: 0.5, 
    };

    // settings for night
    this.effectControllerNightForSunrise = {
      turbidity: 1,
      rayleigh: 0,
      mieCoefficient: 0.01,
      mieDirectionalG: 0.8,
      elevation: -2,
      azimuth: 270,
      exposure: 0.5, 
    };

    // settings for day/sunrise 
    this.effectControllerSunrise = {
      turbidity: 1.5,
      rayleigh: 4,
      mieCoefficient: 0.0005,
      mieDirectionalG: 0.0,
      elevation: 4,
      azimuth: 270,
      exposure: 0.4, 
    };


    this.dirLightSettings = {
      sunset: {
        position: [0, 30, -100],
        intensity: 0.2,
      },
      night: {
        position: [0, -10, -100], 
        intensity: 0.1,
      },
      sunriseNight: {
        position: [-100, -10, 0], 
        intensity: 0.01,
      },
      sunrise: {
        position: [-100, 30, 0], 
        intensity: 0.1,
      },
    }

    this.terrainColorSunset = 0xa593ad;
    this.terrainColorNight = 0x576987;
    this.terrainColorDay = 0xddb3bd;
    this.terrainColorSunrise = 0xf4d0dd;

    this.initSky();

    const noiseTexture = new THREE.TextureLoader().load("https://static.mused.org/noisesmall.png")
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    // Create terrain Shader Material
    this.matTerrain = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }, 
        color: { value: new THREE.Color(this.terrainColorNight) },
        noisetexture: { value: noiseTexture },
        lightColor: { value: this.dirLight.color },
        lightIntensity: { value: this.dirLight.intensity, },
        lightDirection: { value: this.dirLight.position.clone() },
        glitterMaskPow: { value: 11, },
        glitterMultiplier: { value: 90 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.stars = new Stars();
  }

  initSky() {
    const { scene, camera } = Store.getState();

    // start at sunset
    const effectController = this.effectControllerSunset; 

    // Add Sky
    this.sky = new Sky();
    this.sky.scale.setScalar( 450000 );
    this.sky.visible = false;
    scene.add( this.sky );

    this.sun = new THREE.Vector3();

    const uniforms = this.sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    this.sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( this.sun );

    this.dirLight = new THREE.DirectionalLight( 0xffffff, this.dirLightSettings.sunset.intensity);
    this.dirLight.position.set(this.dirLightSettings.sunset.position[0], this.dirLightSettings.sunset.position[1], this.dirLightSettings.sunset.position[2]);
    scene.add( this.dirLight );

    this.dirLight.visible = false;
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 500;
    this.dirLight.shadow.camera.left = -150;
    this.dirLight.shadow.camera.right = 190;
    this.dirLight.shadow.camera.top = 200;
    this.dirLight.shadow.camera.bottom = -110;
    this.dirLight.shadow.camera.updateProjectionMatrix();
    this.dirLight.shadow.autoUpdate = true;


    // const dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
    // scene.add( dirLightHelper );
  }

  handleLoadTerrain(gltf) {
    const { scene } = Store.getState();

    this.terrain = gltf.scene;
    this.terrain.position.set(0, -4, 0);
    this.terrain.scale.set(20, 20, 20)

    gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            // If the mesh's material has a map (texture), store it in originalTexture
            if (child.material.map) {
                originalTexture = child.material.map;
            }
            child.material = this.matTerrain;  // Set the custom shader material
            this.mesh = child; 
        }

    });

    // set visibility off until tour point turns on 
    this.setVisible(false);

    scene.add(this.terrain);
  }

  setCustomMaterial(material) {
    if (!this.terrain) {
      console.warn('Model not loaded yet.');
      return;
    }

    this.terrain.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }

  setVisible(isVisible=true) {
    if (!this.terrain) {
      console.warn('Model not loaded yet.');
      return;
    }

    // set the terrain visibility
    this.terrain.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.visible = isVisible; 
      }
    });

    // directional light & sky visibility
    this.dirLight.visible = isVisible;
    this.sky.visible = isVisible;

  }

  setTransition(startEffect, endEffect, startLightPos, endLightPos, startLightIntensity, endLightIntensity, startColor, endColor, duration) {
    this.transitionState = {
      startTime: Date.now(),
      duration,

      startEffect,
      endEffect,

      startLightPos,
      endLightPos,
      startLightIntensity,
      endLightIntensity,

      startColor: new THREE.Color(startColor),
      endColor: new THREE.Color(endColor),
    };
  }

  toggleTransitions() {
    if (this.currentTransition === 'sunsetToNight') {
      this.transitionNightToSunrise();
      this.currentTransition = 'nightToSunrise';
    } else {
      this.transitionSunsetToNight();
      this.currentTransition = 'sunsetToNight';
    }
  }

  startTransitionLoop() {
    this.currentTransition = 'sunsetToNight';
    this.transitionSunsetToNight();
  }

  transitionSunsetToNight() {
    this.setTransition(
        this.effectControllerSunset, this.effectControllerNight, 
        this.dirLightSettings.sunset.position, this.dirLightSettings.night.position, 
        this.dirLightSettings.sunset.intensity, this.dirLightSettings.night.intensity,
        this.terrainColorSunset, this.terrainColorNight,
        6000,
      )
  }

  transitionNightToSunrise() {
    this.setTransition(
        this.effectControllerNightForSunrise, this.effectControllerSunrise, 
        this.dirLightSettings.sunriseNight.position, this.dirLightSettings.sunrise.position, 
        this.dirLightSettings.sunriseNight.intensity, this.dirLightSettings.sunrise.intensity,
        this.terrainColorNight, this.terrainColorSunrise,
        6000,
      )
  }

  update() {
    this.time += 0.02;

    // Update the progressColor uniform
    this.matTerrain.uniforms.time.value = this.time;

    if (!this.transitionState) return;

    const { renderer, app } = Store.getState();
    const { startTime, duration, startEffect, endEffect, startLightPos, endLightPos, startLightIntensity, endLightIntensity, startColor, endColor } = this.transitionState;
    const uniforms = this.sky.material.uniforms;
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Lerp effect controller
    for (const key in startEffect) {
      if (["elevation", "azimuth", "exposure"].indexOf(key) < 0) {
        uniforms[key].value = THREE.MathUtils.lerp(startEffect[key], endEffect[key], t);
      }

    }

    const phi = THREE.MathUtils.degToRad( 90 - THREE.MathUtils.lerp(startEffect.elevation, endEffect.elevation, t));
    const theta = THREE.MathUtils.degToRad( THREE.MathUtils.lerp(startEffect.azimuth, endEffect.azimuth, t) );

    this.sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( this.sun );

    // Lerp directional light
    this.dirLight.position.lerpVectors(new THREE.Vector3(startLightPos[0], startLightPos[1], startLightPos[2]), new THREE.Vector3(endLightPos[0], endLightPos[1], endLightPos[2]), t);
    this.dirLight.intensity = THREE.MathUtils.lerp(startLightIntensity, endLightIntensity, t);
    this.dirLight.color.lerpColors(startColor, endColor, t);

    if (app.post.godraysPass) {
      app.post.godraysPass.setParams({ 
        color: this.dirLight.color, 
      });
    }

    // and exposure
    renderer.toneMappingExposure = THREE.MathUtils.lerp(startEffect.exposure, endEffect.exposure, t);

    this.matTerrain.uniforms.lightColor.value = this.dirLight.color;
    this.matTerrain.uniforms.lightIntensity.value = this.dirLight.intensity;
    this.matTerrain.uniforms.lightDirection.value = this.dirLight.position.clone();

    // Lerp material color
    if (this.terrain) {
      this.terrain.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.matTerrain.uniforms.color.value.lerpColors(startColor, endColor, t);
        }
      });
    }

    if (t >= 1) {
      this.transitionState = null; // Reset transition state when done
    }
  }

}
