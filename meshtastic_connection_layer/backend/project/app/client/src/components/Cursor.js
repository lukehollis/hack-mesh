import * as THREE from 'three';


import Store from '../Store';



export default class Cursor {
  constructor() {
    const { scene, cursorOpacity, } = Store.getState();

    this.innerRadius = 0.15;
    this.outerRadius = 0.19;
    this.thetaSegments = 64;

    // Create mesh with initial geometry and material
    const geometry = new THREE.RingGeometry(this.innerRadius, this.outerRadius, this.thetaSegments);
    // const geometry = new THREE.SphereGeometry(0.08, 32, 32);
    // const geometryInner = new THREE.SphereGeometry(0.01, 32, 32);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: cursorOpacity
    });

    // const materialInner = new THREE.MeshBasicMaterial({
    //   color: 0xffffff,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    //   depthTest: true,
    //   depthWrite: true,
    //   opacity: 1.0,
    // });
    
    this.mesh = new THREE.Mesh(geometry, material);
    // this.meshInner = new THREE.Mesh(geometryInner, materialInner);
    this.mesh.renderOrder = 10;
    // this.meshInner.renderOrder = 10;
    

    // Add mesh to scene
    scene.add(this.mesh);
    // scene.add(this.meshInner);

    // initial update
    this.updateParameters();
    this.raycaster = new THREE.Raycaster();
  } 

  // This method will be called in the animation loop to position the cursor
  update() {
    const { cursor } = Store.getState();
    this.mesh.position.copy(cursor.position);
    // this.meshInner.position.copy(cursor.position);
    this.mesh.rotation.setFromQuaternion(cursor.rotation);
    this.updateParameters();


    // 
    // if you need to raycast to log something in the world that the cursor is intersecting with
    // 
    // Update raycaster
    // this.raycaster.set(cursor.position, new THREE.Vector3(0, 0, -1).applyQuaternion(cursor.rotation));

    // // Check for intersections with dollhouse
    // const { app } = Store.getState(); // Assuming you have stored the dollhouse in your state
    // let intersects = [];

    // if (app.envCube && app.envCube.envCube && app.envCube.envCube.group) {
    //   app.envCube.envCube.group.children.forEach((child, i) => {
    //     const childIntersects = this.raycaster.intersectObject(child);
    //     Array.prototype.push.apply(intersects, childIntersects);
    //   });

    // }

    // if (intersects.length > 0) {
    //   const worldIntersectionPoint = intersects[0].object.localToWorld(intersects[0].point.clone());
    //   console.log(intersects);
    //   console.log("Intersection point in world coordinates:", worldIntersectionPoint);
    // }
  }

  updateParameters() {
    const { cursor, cursorOpacity } = Store.getState();

    if (
        cursor.position.x === 0 &&
        cursor.position.y === 0 &&
        cursor.position.z === 0
    ) {
      this.mesh.visible = false;
      // this.meshInner.visible = false;
    } else {
      this.mesh.visible = true;
      // this.meshInner.visible = true;
    }

    this.mesh.material.opacity = cursorOpacity;
    // this.meshInner.material.opacity = cursorOpacity + 0.2;
  }
}
