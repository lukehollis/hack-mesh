import * as THREE from 'three';

import Store from '../Store';


export default class FloorMarker {
  constructor({ uuid, position, floorPosition, rotation, image, }) {
    const { space, floorMarkers, currentNode } = Store.getState();

    this.uuid = uuid;
    this.position = position;
    this.floorPosition = floorPosition;
    this.rotation = rotation;
    this.image = image;

    this.ringOpacityDefault = 0.1;
    this.ringOpacityHovered = 0.5;
    this.ringOpacityActive = 1.0;

    this.group = new THREE.Group();

    // The marker plane
    const planeGeometry = new THREE.PlaneGeometry(0.6, 0.6, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.floorMarker = this;  // Back reference
    this.group.add(planeMesh);

    // The ring around the marker
    const ringGeometry = new THREE.RingGeometry(0.0, 0.08, 32);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: this.ringOpacityDefault,
      depthWrite: true,
      depthTest: true
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.renderOrder = 4;

    const activeRingGeometry = new THREE.RingGeometry(0.16, 0.2, 32);
    const activeRingMesh = new THREE.Mesh(activeRingGeometry, ringMaterial);
    activeRingMesh.renderOrder = 4;

    // regularize scale
    const parentScale = space.data.sceneSettings.nodes.scale;
    let inverseScale = new THREE.Vector3(1 / parentScale, 1 / parentScale, 1 / parentScale);
    ringMesh.scale.multiply(inverseScale);
    activeRingMesh.scale.multiply(inverseScale);

    if (currentNode.uuid === this.uuid) { 
      activeRingMesh.visible = true;
    } else {
      activeRingMesh.visible = false;
    }
    this.activeRingMesh = activeRingMesh;

    // add to group
    this.group.add(ringMesh);
    this.group.add(activeRingMesh);
    this.group.position.set(floorPosition.x, floorPosition.y + 0.2, floorPosition.z);
    this.group.rotation.x = Math.PI / 2;
    this.group.node = { uuid: this.uuid, type: "FLOOR_MARKER" };

    const newFloorMarkers = [...floorMarkers, this.group];
    Store.setState({ floorMarkers: newFloorMarkers });
  }

  onMouseEnter() {
    const { viewMode } = Store.getState();
    this.group.children.forEach(child => {
      if (child.geometry.type === 'RingGeometry') {
        if (viewMode === "ORBIT") {
          child.material.opacity = this.ringOpacityHovered + 0.2;
        } else {
          child.material.opacity = this.ringOpacityHovered;
        }
      }
    });
  }

  onMouseLeave() {
    const { viewMode } = Store.getState();
    this.group.children.forEach(child => {
      if (child.geometry.type === 'RingGeometry') {
        if (viewMode === "ORBIT") {
          child.material.opacity = this.ringOpacityDefault + 0.2;
        } else {
          child.material.opacity = this.ringOpacityDefault;
        }
      }
    });
  }

}