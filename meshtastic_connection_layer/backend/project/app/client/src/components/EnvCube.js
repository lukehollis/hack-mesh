import * as THREE from 'three';

import AnnotationGraph from './AnnotationGraph';

import { useCachedTexture, } from '../lib/util';
import Store from '../Store';



class EnvCube {
  constructor(node, options={ isOutgoing: false }) {
    const { scene, camera }= Store.getState();

    this.node = node;
    this.options = options;
    this.raycaster = new THREE.Raycaster();
    this.group = new THREE.Group();
    this.materials = [];
    this.meshes = [];
    this.fullResolutionFaces = new Set(); 

    // build the face planes
    this.createFaces();

    // position /rotate the cube
    this.group.position.copy(camera.position);
    this.setRotation(node);

    scene.add(this.group);
  }

  getRotation(faceI) {
    switch (faceI) {
      case 2: return [0, Math.PI / 2, 0];
      case 4: return [0, -Math.PI / 2, 0];
      case 0: return [Math.PI / 2, 0, Math.PI];
      case 5: return [-Math.PI / 2, 0, Math.PI];
      case 1: return [0, Math.PI, 0];
      case 3: return [0, 0, 0];
      default: return [0, 0, 0];
    }
  }

  setRotation(node) {
    const { space }= Store.getState();
    const nodeGroupSettings = space.data.sceneSettings.nodes;

    // Node rotation directly from quaternion
    const nodeQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      node.rotation.x,
      -node.rotation.y,
      node.rotation.z,
    ));

    // Node group rotation as quaternion
    const nodeGroupQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(180),
      'XYZ'
    ));

    // Combine the quaternions (order matters)
    nodeQuaternion.multiply(nodeGroupQuaternion);

    // Apply the combined rotation to the group
    this.group.quaternion.copy(nodeQuaternion);
  }

  getPosition(faceI) {
    // faceI = 2 -> Left
    // faceI = 4 -> Right
    // faceI = 0 -> Top
    // faceI = 5 -> Bottom
    // faceI = 1 -> Front
    // faceI = 3 -> Back
    switch (faceI) {
      case 2: return [-100, 0, 0];
      case 4: return [100, 0, 0];
      case 0: return [0, 100, 0];
      case 5: return [0, -100, 0];
      case 1: return [0, 0, 100];
      case 3: return [0, 0, -100];
      default: return [0, 0, 0];
    }
  }

  createFaces() {
    const { space, isMobile, materialCache } = Store.getState();
    const size = 200;
    Array.from({ length: 6 }).forEach((_, faceI) => {

      let texture = null;
      let opacity = this.options.isOutgoing ? 0 : 1;
      if (this.node.uuid.startsWith("map")) {
        opacity = 0; 
      }

      // get 1024 tex
      let resolution = "1024";

      texture = useCachedTexture(this.node.uuid, faceI, resolution, space.data.version);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity, 
        depthWrite: false,
        depthTest: false,
      });

      this.materials.push(material);
    });

    // Create the faces with the materials
    this.materials.forEach((material, faceI) => {
      this.createFace(size, this.getRotation(faceI), this.getPosition(faceI), faceI);
      materialCache[this.node.uuid] = materialCache[this.node.uuid] || {};
      materialCache[this.node.uuid][faceI] = materialCache[this.node.uuid][faceI] || {};
      materialCache[this.node.uuid][faceI]["1024"] = material;
    });

    Store.setState({materialCache: { [this.node.uuid]: materialCache[this.node.uuid], ...Store.getState().materialCache} });
  }

  createFace(size, rotation, position, materialIndex) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const mesh = new THREE.Mesh(geometry, this.materials[materialIndex]);
    mesh.rotation.set(...rotation);
    mesh.position.set(...position);
    this.meshes.push(mesh);
    this.group.add(mesh);
  }

  updateFaces() {
    const { space, camera, isMobile }= Store.getState();
    if (this.node.uuid.startsWith("map")) return;

    for (let i = 0; i<this.materials.length; i++) {
      let resolution = "1024";

      const texture = useCachedTexture(this.node.uuid, i, resolution, space.data.version);
      this.materials[i].map = texture; 
      this.materials[i].needsUpdate = true;
      this.fullResolutionFaces = new Set(); 
    }

    // Update the group's position to match the camera's position
    this.group.position.copy(camera.position);

    // rotate the cube
    this.setRotation(this.node);
  }

  getVisibleFaces() {
    const { camera } = Store.getState();
    const visibleFaces = [];

    this.group.children.forEach((child, i) => {
      if (this.fullResolutionFaces.has(i)) return;

      this.raycaster.setFromCamera(camera.position, camera);
      const intersects = this.raycaster.intersectObject(child);

      if (intersects.length > 0) {
        visibleFaces.push(i);
      }
    });

    return visibleFaces;
  }


  updateFacesFullRes(visibleFaces) {
    const { space }= Store.getState();

    visibleFaces.forEach(i => {
      // Skip if already at full resolution
      if (this.fullResolutionFaces.has(i)) return;

      // don't try to load face images for map points
      if (this.node.uuid.startsWith("map")) return;

      // Load the full-resolution 4k texture
      const texture = useCachedTexture(this.node.uuid, i, "4096", space.data.version, this._updateFullResFaceCallback.bind(this));
    });
  }

  _updateFullResFaceCallback(uuid, i, texture) {
    if (uuid !== this.node.uuid) {
      // This texture is no longer relevant, so do not update the material
      return;
    }

    this.materials[i].map = texture;
    this.materials[i].needsUpdate = true;
    this.fullResolutionFaces.add(i); // Mark this face as loaded at full resolution
  }

  updateVisibleFaces() {
    const { isMobile, isNavigating } = Store.getState();

    if (!isMobile && !isNavigating) {
      const visibleFaces = this.getVisibleFaces();
      this.updateFacesFullRes(visibleFaces);  
    }
  }
}

export default class EnvCubeManager {
  constructor() {
    const { currentNode, outgoingNode, tourGuidedMode }  = Store.getState();

    this.envCube = new EnvCube(currentNode);
    this.envCubeOutgoing = new EnvCube(outgoingNode, { isOutgoing: true });

    if (tourGuidedMode) {
      this.annotationGraph = new AnnotationGraph(); 
    }

    // set the cube render order based on app state
    this._setCubeRenderOrder();
  }

  crossfade() {
    const store = Store.getState();
    const { currentNode, outgoingNode } = store;

    // set navigating semaphore
    Store.setState({ isNavigating: true });

    // update faces on outgoing cube 
    this.envCubeOutgoing.node = outgoingNode; 
    this.envCubeOutgoing.updateFaces();

    // make outgoing cube cover main cube
    this.envCubeOutgoing.materials.forEach((material) => (material.opacity = 1));

    // update faces on main cube
    this.envCube.node = currentNode;
    this.envCube.updateFaces();

    // fade out outgoing cube
    let progress = 0;
    let duration = 600;
    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;
      this.envCubeOutgoing.materials.forEach((material) => (material.opacity = 1 - factor));

      if (progress >= duration) {
        Store.setState({ isNavigating: false });
        clearInterval(interval);
      }
    }, 20);
  }

  fadeOut(callback=null) {
    const store = Store.getState();

    // fade out outgoing cube
    let progress = 0;
    let duration = 200;
    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      this.envCube.materials.forEach((material) => (material.opacity = 1 - factor));

      if (progress >= duration) {
        clearInterval(interval);
        this.envCube.materials.forEach((material) => (material.visible = false));
        if (callback) {
          callback();
        }
      }
    }, 20);
  }

  hide() {
    const store = Store.getState();
    store.scene.remove(this.envCube.group);
    store.scene.remove(this.envCubeOutgoing.group);
  }

  show(currentNode, outgoingNode) {
    this.envCube = new EnvCube(currentNode);
    this.envCubeOutgoing = new EnvCube(outgoingNode, { isOutgoing: true });
  }

  dimScene(opacity) {
    this.envCube.materials.forEach((material) => (material.opacity = opacity));
  }

  fadeIn(callback=null) {
    const store = Store.getState();
    this.envCube.materials.forEach((material) => (material.opacity = 0));
    this.envCube.materials.forEach((material) => (material.visible = true));
    
    // fade out outgoing cube
    let progress = 0;
    let duration = 200;
    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      this.envCube.materials.forEach((material) => (material.opacity = factor));

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) {
          callback();
        }
      }
    }, 20);
  }

  handleToggleDebugMode() {
    this._setCubeRenderOrder();
  }

  handleToggleViewMode() {
    const { debugMode, viewMode } = Store.getState();
    this._setCubeRenderOrder();

    if (viewMode === "FPV") {
      this.fadeIn();
    } else {
      this.fadeOut();
    }
  }

  _setCubeRenderOrder() {
    const { debugMode, viewMode } = Store.getState();
    
    // Calculate the EnvCube's render order based on the current viewMode and debugMode
    const cubeRenderOrder = (viewMode === "FPV" && !debugMode) ? 1 : 0;

    // Apply the render order to each mesh in the EnvCube
    this.envCube.group.children.forEach(child => {
      child.renderOrder = cubeRenderOrder;
    });

    // // Apply the render order to each mesh in the envCubeOutgoing
    this.envCubeOutgoing.group.children.forEach(child => {
      child.renderOrder = cubeRenderOrder + 1;
    });

  }

  toggleMaterialType(makeUnlit=true) {
    // Iterate through the materials of the envCube
    this.envCube.materials.forEach((material, index) => {
      // Create a new material instance based on the opposite type
      let newMaterial;
      if (makeUnlit) {
        newMaterial = new THREE.MeshBasicMaterial({
          map: material.map,
          transparent: material.transparent,
          opacity: material.opacity
        });
      } else {
        newMaterial = new THREE.MeshPhongMaterial({
          map: material.map,
          transparent: material.transparent,
          opacity: material.opacity
        });
      }
      // Replace the old material with the new one
      this.envCube.materials[index] = newMaterial;
      // Update the mesh to use the new material
      this.envCube.group.children[index].material = newMaterial;
    });

    // Do the same for envCubeOutgoing
    this.envCubeOutgoing.materials.forEach((material, index) => {
      let newMaterial;
      if (makeUnlit) {
        newMaterial = new THREE.MeshBasicMaterial({
          map: material.map,
          transparent: material.transparent,
          opacity: material.opacity
        });
      } else {
        newMaterial = new THREE.MeshPhongMaterial({
          map: material.map,
          transparent: material.transparent,
          opacity: material.opacity
        });
      }
      this.envCubeOutgoing.materials[index] = newMaterial;
      this.envCubeOutgoing.group.children[index].material = newMaterial;
    });
  }

  setPosition(position) {
    this.envCube.group.position.copy(position);
    this.envCubeOutgoing.group.position.copy(position);
  }

  setDepthPropertiesForMaterials(enableDepth) {
    // Assuming enableDepth is a boolean (true or false)

    // Update envCube materials
    this.envCube.materials.forEach((material) => {
        material.depthWrite = enableDepth;
        material.depthTest = enableDepth;
        material.needsUpdate = true; // Important to apply changes
    });

    // Update envCubeOutgoing materials
    this.envCubeOutgoing.materials.forEach((material) => {
        material.depthWrite = enableDepth;
        material.depthTest = enableDepth;
        material.needsUpdate = true; // Important to apply changes
    });
}


  update() {
    // figure out a better way to update to 4k faces 
    this.envCube.updateVisibleFaces();
  }
}

