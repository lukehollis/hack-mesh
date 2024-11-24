import * as THREE from 'three';


import Store from '../Store';


export default class Flashlight {
  constructor() {
    const { scene, camera } = Store.getState();
    const color = 0xeee6d7;  
    const intensity = 150;
    const distance = 1200;
    const angle = 0.24;
    const penumbra = 0.6;
    const decay = 1;
    
    // Create the spotlight
    this.light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    this.light.target.position.set(0, -1, 0); // Initially point it at the cursor
    
    scene.add(this.light);
    this.light.position.set(camera.position.x, camera.position.y - 0.04, camera.position.z);

    // Add spotlight and its target to the scene
    scene.add(this.light);
    scene.add(this.light.target);
    
    const radius = 20;
    const height = 100;
    const radialSegments = 32;
    const coneGeo = new THREE.ConeGeometry(radius, height, radialSegments); 
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xeee6d7,
      transparent: true,
      opacity: 0.001,
    });

    this.cone = new THREE.Mesh(coneGeo, coneMat); 
    this.cone.geometry.rotateX(-Math.PI / 2);
    this.cone.geometry.translate(0, 0, height / 2);
    this.cone.layers.enable(1);
    this.cone.renderOrder = 11;
    

    this.cone.position.copy(this.light.position);
    this.cone.lookAt(this.light.target.position);
    scene.add(this.cone);


    // Check if the device is mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
    if (this.isMobile) {
      // Point the light straight ahead from the camera
      this.setLightToDefaultPosition();
    }
  }

  // Show the flashlight
  show() {
    this.light.visible = true;
    this.cone.visible = true;
  }

  // Hide the flashlight
  hide() {
    this.light.visible = false;
    this.cone.visible = false;
  }

  // Toggle the flashlight visibility
  toggleFlashlight() {
    const currentState = this.light.visible;
    this.light.visible = !currentState;
    this.cone.visible = !currentState;
  }

  setLightToDefaultPosition() {
    const { camera } = Store.getState();

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1);
    const target = new THREE.Vector3().copy(camera.position).add(forward);
    this.light.target.position.set(target);
  }
  
  // Update the flashlight position and direction
  update() {
    const { camera, cursor, viewMode } = Store.getState();
    
    // Point the light towards the cursor
    if (cursor.position.x || cursor.position.y || cursor.position.z) {
      this.light.target.position.copy(cursor.position);
    } else if (this.isMobile) {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1);
      const target = new THREE.Vector3().copy(camera.position).add(forward);
      this.light.target.position.copy(target);
    }

    if (viewMode === "FPV") {
      // Update light position
      this.light.position.set(camera.position.x, camera.position.y - 0.06, camera.position.z);

      // Update the transparent cone to follow the light and its target
      this.cone.position.copy(this.light.position);
      this.cone.lookAt(this.light.target.position);
    } 
    
  }
}
