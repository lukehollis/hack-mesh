import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import FloorMarker from './FloorMarker';

import Store from '../Store';



export class Node {
  constructor({ uuid, position, floorPosition, rotation, image, isActive }) {
    // store
    const { debugMode } = Store.getState();
    this.uuid = uuid;
    this.position = position;
    this.floorPosition = floorPosition;
    this.rotation = rotation;
    this.image = image;
    this.isActive = isActive;

    // Create group as a container for the mesh and the floormarker
    this.group = new THREE.Group();

    // Create mesh
    const geometry = new THREE.SphereGeometry(isActive ? 0.3 : 0.2, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: isActive ? 0x2a9df4 : 0xffffff, 
      wireframe: true
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = debugMode;
    this.mesh.renderOrder = 10;
    
    // for raycast click event
    this.group.node = this;

    // Add mesh to the group
    this.group.add(this.mesh);

    // Position
    this.group.position.set(position.x, position.y, position.z);

    // floormarker
    this.floormarker = new FloorMarker({ uuid, position, floorPosition, rotation, image });

    // Add floormarker as a child of the node's mesh
    // this.group.add(this.floormarker.group);
  }

  toggleSphereVisibility() {
    const { debugMode } = Store.getState();
    if (this.mesh) {
      this.mesh.visible = debugMode;
    }
  }

  toggleFloorMarkerVisibility(visible) {
    if (this.floormarker && this.floormarker.group) { // Assuming floormarker has a mesh property
      this.floormarker.group.visible = visible;
    }
  }

  getMesh() {
    return this.group;
  }

  getFloormarkerMesh() {
    return this.floormarker.group;
  }

  setFloorMarkerPosition() {
    const { app, scene } = Store.getState();

    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    // Create a new Vector3 to store the world position
    const worldPosition = new THREE.Vector3();

    // Get the world position of the node
    this.mesh.getWorldPosition(worldPosition);

    // Set the raycaster's origin to the node's world position and its direction to down
    raycaster.set(worldPosition, new THREE.Vector3(0, -1, 0));

    const intersects = raycaster.intersectObject(app.dollhouse.gltf.scene.children[0]);

    // If there's an intersection, set the floorPosition to the intersection point
    if (intersects.length > 0) {
      // Convert the intersection point from world coordinates to local coordinates
      this.group.parent.worldToLocal(intersects[0].point);

      // Set the floormarker's position to the intersection point
      this.floormarker.group.position.copy(intersects[0].point);
    } else {
    }
  }

  floormarkerSetActive(activeState) {
    this.floormarker.activeRingMesh.visible = activeState;
  }

  update() {
    // Create a new Vector3 to store the world position
    const worldPosition = new THREE.Vector3();

    // Get the world position of the node
    this.group.getWorldPosition(worldPosition);

    // Update the FloorMarker's position to match the world position
    this.floormarker.position.copy(worldPosition);
    this.floormarker.position.y = -1.5;
  }
}


export default class Nodes {

  constructor() {
    // store
    const { scene, space } = Store.getState();

    // Create parent object
    const parent = new THREE.Group();

    // Add child objects
    this.nodes = [];
    space.data.nodes.forEach(node => {
      const np = new Node(node);
      this.nodes.push(np);

      // Add to parent group
      parent.add(np.getMesh());
      parent.add(np.getFloormarkerMesh());
    });

    // Position
    const offset = space.data.sceneSettings.nodes.offsetPosition;
    parent.position.set(offset.x, offset.y, offset.z);
    
    // Rotation
    const rotOffset = space.data.sceneSettings.nodes.offsetRotation;
    parent.rotation.set(
      THREE.MathUtils.degToRad(rotOffset.x),
      THREE.MathUtils.degToRad(rotOffset.y), 
      THREE.MathUtils.degToRad(rotOffset.z)
    );

    // Scale
    const scale = space.data.sceneSettings.nodes.scale;
    parent.scale.set(scale, scale, scale);

    // add to scene
    scene.add(parent);

    this.group = parent;
    // this.initTransformControls();
  }

  handleToggleDebugMode() {
    const { debugMode } = Store.getState();
    this.nodes.forEach(np => {
      np.toggleSphereVisibility();
    }); 
  }

  handleToggleViewMode() {
    const { viewMode, floorMarkers } = Store.getState();

    floorMarkers.forEach(floorMarker => {

      if (viewMode === "ORBIT") {
        floorMarker.children.forEach(child => {
          if (child.geometry.type === 'RingGeometry') {
            child.material.opacity = 0.5;
          }
        });
      } else {
        floorMarker.children.forEach(child => {
          if (child.geometry.type === 'RingGeometry') {
            child.material.opacity = 0.3;
          }
        });
      }
    });
  }

  // Show all floor markers
  showFloorMarkers() {
    this.nodes.forEach(np => {
      np.toggleFloorMarkerVisibility(true);
    });
  }

  // Hide all floor markers
  hideFloorMarkers() {
    this.nodes.forEach(np => {
      np.toggleFloorMarkerVisibility(false);
    });
  }

  // Toggle the visibility of all floor markers
  toggleFloorMarkers() {
    const firstNode = this.nodes[0];
    const currentState = firstNode && firstNode.floormarker && firstNode.floormarker.mesh ? firstNode.floormarker.mesh.visible : false;
    this.nodes.forEach(np => {
      np.toggleFloorMarkerVisibility(!currentState);
    });
  }

  updateFloorMarkerPositions() {
    this.nodes.forEach(node => {
      node.setFloorMarkerPosition();
    });
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

        console.log('World Position:', worldPosition.x, worldPosition.y, worldPosition.z);

        const rotation = this.transformControls.object.rotation;
        const scale = this.transformControls.object.scale;

        console.log('Nodes Rotation:', rotation.x, rotation.y, rotation.z);
        console.log('Nodes Scale:', scale.x, scale.y, scale.z);
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
    if (this.group && this.transformControls) {
      this.transformControls.attach(this.group);
    }
  }

  detachFromTransformControls() {
    if (this.transformControls) {
      this.transformControls.detach();
    }
  }

  update () {
    // Loop through all child nodes
    for (let i = 0; i < this.group.children.length; i++) {
      // Call the update method of each child node
      if (typeof this.group.children[i].update === 'function') {
        this.group.children[i].update();
      }
    }
  }
 
}

