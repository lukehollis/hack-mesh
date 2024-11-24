import * as THREE from 'three';



import { useCachedTexture, } from '../lib/util';
import Store from '../Store';



export default class Skybox {
  constructor() {
    // global store
    const { 
      scene, isMobile 
    } = Store.getState();

    scene.background = new THREE.Color(0xe2dac9);

    if (!isMobile) {
      // this.turnOnFog();
    }
    
    // this.initSkyboxBackground();
  }

  initSkyboxBackground() {
    const { 
      scene, loadingManager, isMobile,
    } = Store.getState();

    let resolution = "1024";
    const loader = new THREE.CubeTextureLoader(loadingManager);

    if (isMobile) {
      resolution = "512";
    }

    const textureUrls = [
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face2.jpg/full/${resolution},/0/default.jpg`, // Right
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face4.jpg/full/${resolution},/0/default.jpg`, // Left
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face0.jpg/full/${resolution},/0/default.jpg`, // Top
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face5.jpg/full/${resolution},/0/default.jpg`, // Bottom
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face1.jpg/full/${resolution},/0/default.jpg`, // Front
        `https://iiif.mused.org/spaceshare/kloppenheim_06_8k_6q_v2v5_face3.jpg/full/${resolution},/0/default.jpg`, // Back
    ];

    this.cubeTexture = loader.load(textureUrls);
    scene.background = this.cubeTexture;
  }

  removeSkyboxBackground() {
    const { 
      scene, loadingManager
    } = Store.getState();
    this.cubeTexture = null;
    scene.background = null; // new THREE.Color(0xe2dac9);
  }

  turnOnFog() {
    // global store
    const { 
      scene
    } = Store.getState();
    const color = 0xc3c4b4;  
    const near = 2;
    const far = 15000;

    //scene.fog = new THREE.FogExp2(color, 0.001);
    // scene.fog = new THREE.Fog(color, near, far);
  }

  turnOffFog() {
    // global store
    const { 
      scene
    } = Store.getState();
    scene.fog = null;
  }

  changeToNight() {
    if (this.nightTexture && this.skyboxMesh) {
      this.skyboxMesh.material.map = this.nightTexture;
      this.skyboxMesh.material.needsUpdate = true;
      this.skyboxMesh.rotation.y = 0; 
    }
  }

  changeToDay() {
    if (this.dayTexture && this.skyboxMesh) {
      this.skyboxMesh.material.map = this.dayTexture;
      this.skyboxMesh.material.needsUpdate = true;
      this.skyboxMesh.rotation.y = Math.PI / 2;
    }
  }

}
