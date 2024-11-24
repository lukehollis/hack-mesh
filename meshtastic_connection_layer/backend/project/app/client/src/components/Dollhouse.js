import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import Store from '../Store';


export default class Dollhouse {
  constructor() {
    const { viewMode, debugMode, scene, loadingManager, space } = Store.getState();

    this.gltf = null;

    // Load the model for the dollhouse
    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://static.mused.org/spaceshare/draco1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    
    try {
      loader.load(space.data.mesh, gltf => this.onLoad(gltf), undefined, function (error) {
        console.error('An error occurred while loading the model:', error);
      });
    } catch (e) {
      console.error('Caught error:', e);
    }

    // this.initTransformControls();
  }

  onLoad(gltf) {

    const { app, scene, space } = Store.getState();
    gltf.scene.renderOrder = 1;

    // save gltf to class for future use
    this.gltf = gltf;

    const dollhouseSettings = space.data.sceneSettings.dollhouse;

    // Environment orientation
    const position = new THREE.Vector3(dollhouseSettings.offsetPosition.x, dollhouseSettings.offsetPosition.y, dollhouseSettings.offsetPosition.z);
    const rotation = new THREE.Euler(
        dollhouseSettings.offsetRotation.x, 
        dollhouseSettings.offsetRotation.y, 
        dollhouseSettings.offsetRotation.z
      );
    const scale = dollhouseSettings.scale;

    // Apply position, rotation, and scale to the gltf scene
    gltf.scene.position.copy(position);
    gltf.scene.rotation.copy(rotation);

    if (typeof scale === 'number') {
      gltf.scene.scale.set(scale, scale, scale); // Uniform scale
    } else if (scale instanceof THREE.Vector3) {
      gltf.scene.scale.copy(scale); // Non-uniform scale
    }

    // reference for click when necessary
    gltf.scene.dollhouse = this;
    // Add the dollhouse to each of the children of gltf.scene
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.dollhouse = this;
      }
    });

    // add the gltf to the scene
    scene.add(gltf.scene);

    // do the common logic of rendering the mesh in different states with different transparency
    this._updateTransparency();
  }

  handleToggleDebugMode() {
    // do the common logic of rendering the mesh in different states with different transparency
    this._updateTransparency();
  }

  handleToggleViewMode() {
    // do the common logic of rendering the mesh in different states with different transparency
    this._updateTransparency();
  }

  // Show the dollhouse
  show() {
    const { scene } = Store.getState();
    if (!this.gltf || !this.gltf.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }
    this.gltf.scene.visible = true;

    // Remove existing occluders
    const existingOccluders = [];
    scene.traverse((child) => {
      if (child.name === 'occluder') {
        existingOccluders.push(child);
      }
    });
    existingOccluders.forEach(occluder => {occluder.visible = false} );

    this.gltf.scene.traverse((child) => {
      this.gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
        }
      });
    });
  }

  // Hide the dollhouse
  hide(options={ hideOccluders: false }) {
    const { scene } = Store.getState();

    if (!this.gltf || !this.gltf.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }
    this.gltf.scene.visible = false;

    this.gltf.scene.traverse((child) => {
      this.gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });
    });

    this.hideOccluders();
  }

  hideOccluders() {
    const { scene } = Store.getState();
    const existingOccluders = [];

    console.log("occluders hidden");

    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        existingOccluders.push(child);
      }
    });
    existingOccluders.forEach(occluder => {occluder.visible = false} );
  }

  showOccluders() {
    const { scene } = Store.getState();
    const existingOccluders = [];

    console.log("occluders shown");

    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        existingOccluders.push(child);
      }
    });
    existingOccluders.forEach(occluder => {occluder.visible = true} );
  }

  // Toggle the dollhouse visibility
  toggleVisibility() {
    if (!this.gltf || !this.gltf.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }
    this.gltf.scene.visible = !this.gltf.scene.visible;
  }


  _updateTransparency() {
    const { 
      debugMode, viewMode, scene, space,
      tourLightMode
    } = Store.getState();
    const transparent = (viewMode === "FPV") && !debugMode;
    const renderOrder = viewMode === "ORBIT" || debugMode ? 2 : 1;

    if (this.gltf && this.gltf.scene) {

      // Remove existing occluders
      const existingOccluders = [];
      this.gltf.scene.traverse((child) => {
        if (child.name === 'occluder') {
          existingOccluders.push(child);
        }
      });
      existingOccluders.forEach(occluder => {
        // Remove the occluder from its actual parent node
        if (occluder.parent) {
          occluder.parent.remove(occluder);
        }
      });

      // set transparencies
      this.gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.needsUpdate = true;
          child.material.opacity = transparent ? 0 : 1;
          child.material.wireframe = debugMode;
          child.material.side = THREE.FrontSide;
          child.renderOrder = renderOrder;
          child.isDollhouse = true;

          if (viewMode === "ORBIT") {
            child.material.depthWrite = true;
            child.material.depthTest = true;
          } else {
            child.material.depthWrite = false;
            child.material.depthTest = false;
          }
        }
      });

      // handle occluders
      if (viewMode === "FPV" && !debugMode) {
        this.gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // FPV occlusions

            // FPV occlusions
            const occluderMat = new THREE.MeshBasicMaterial({
              colorWrite: false, // Don't write to color buffer
              transparent: true,
              // color: 0x000000,
            });

            // Create the occluder mesh with the same geometry and a custom material
            let occluder = new THREE.Mesh(child.geometry, occluderMat);
            occluder.name = 'occluder'; // Give the occluder a name

            // Copy the position, rotation, and scale from the original mesh
            occluder.position.copy(child.position);
            occluder.rotation.copy(child.rotation);
            occluder.scale.copy(child.scale);

            // If the original mesh uses quaternion for rotation, copy that as well
            occluder.quaternion.copy(child.quaternion);

            // Ensure the occluder's matrix is updated
            occluder.updateMatrix();

            // Add the occluder to the scene at the same hierarchical level as the original
            child.parent.add(occluder);

            occluder.renderOrder = renderOrder + 1;
          }
        });
      }


    }


    // hack for tour mode for model, will come back to for refactor
    // if (tourLightMode) {
    //   this.hide();      
    // } else {
    //   this.show();
    // }
  }

  initTransformControls() {
      const { camera, canvas, scene } = Store.getState();
      this.transformControls = new TransformControls(camera, canvas);
      this.transformControls.addEventListener('change', () => {
        if (this.transformControls.object) {
          // Create a new Vector3 to store the world position
          const worldPosition = new THREE.Vector3();

          // Get the world position of the object
          this.transformControls.object.getWorldPosition(worldPosition);

          console.log('Dollhouse Position:', worldPosition.x, worldPosition.y, worldPosition.z);

          const rotation = this.transformControls.object.rotation;
          const scale = this.transformControls.object.scale;

          console.log('Dollhouse Rotation:', rotation.x, rotation.y, rotation.z);
          console.log('Dollhouse Scale:', scale.x, scale.y, scale.z);
        }
      });

      this.transformControls.addEventListener('dragging-changed', (event) => {
        const { app } = Store.getState();
        app.rig.orbitControls.enabled = !event.value;
      });

      scene.add(this.transformControls);

      // Keyboard controls for switching modes
      window.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'q':
            this.attachToTransformControls();
            break;
          case 'w':
            this.transformControls.setMode('translate');
            break;
          case 'e':
            this.transformControls.setMode('rotate');
            break;
          case 'r':
            this.transformControls.setMode('scale');
            break;
        }
      });

    }

    attachToTransformControls() {
      if (this.gltf && this.transformControls) {
        this.transformControls.attach(this.gltf.scene);
      }
    }

    detachFromTransformControls() {
      if (this.transformControls) {
        this.transformControls.detach();
      }
    }
}

