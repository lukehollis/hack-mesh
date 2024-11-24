import * as THREE from 'three';

import Store from '../Store';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


export default class Photograph {
  constructor(imageUrl) {
    const { scene, camera } = Store.getState();

    this.lerp = {
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      alpha: 1,
    }
    this.shouldRemove = false;

    this.randomZRotation = Math.random() * 0.10 - 0.05;

    this.rightShift = 0;
    if (window.innerWidth > 1100) {
      this.rightShift = 0.5;
    } else if (window.innerWidth > 900) {
      this.rightShift = 0.7;
    } else if (window.innerWidth > 640) {
      this.rightShift = 0.5;
    }

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      // Get image dimensions
      let width = texture.image.width;
      let height = texture.image.height;

      // Calculate aspect ratio
      const aspectRatio = width / height;

      // Scale dimensions so that the long side is 1 meter
      if (width > height) {
        width = 1;
        height = 1 / aspectRatio;
      } else {
        height = 1;
        width = aspectRatio;
      }

      // Create plane geometry
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        depthWrite: true,
        depthTest: true,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.renderOrder = 100;

      // Initialize position to the left of the camera
      const left = new THREE.Vector3(-1, 0, 0);
      left.applyQuaternion(camera.quaternion).normalize().multiplyScalar(3);

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1.5);
      this.mesh.position.copy(camera.position).add(forward).add(left);

      // Make the mesh look at the camera
      this.mesh.lookAt(camera.position);
      this.mesh.rotation.z += this.randomZRotation; 

      // Add to scene
      scene.add(this.mesh);

      // Initialize lerp properties
      this.slideIn();
   });

    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  slideIn() {
    const { camera } = Store.getState();

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1);

    // on larger screens move the photo slightly right to make room for text 
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion).normalize().multiplyScalar(this.rightShift);

    const lerpTarget = new THREE.Vector3().copy(camera.position).add(forward).add(right);
    lerpTarget.z + 30;

    this.lerp.from = this.mesh.position.clone();
    this.lerp.to = lerpTarget; 
    this.lerp.alpha = 0;
  }

  slideOut() {
    const { camera } = Store.getState();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion).normalize().multiplyScalar(3);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1.5);
    const direction = new THREE.Vector3().copy(camera.position).add(forward).add(right);

    if (this.mesh) {
      this.lerp.from = this.mesh.position.clone();
    } else {
      this.lerp.from = direction;
    }

    this.lerp.to = direction;
    this.lerp.alpha = 0;
    this.shouldRemove = true;
  }

  handleMouseMove(event) {
    if (this.mesh) {
      const { camera } = Store.getState();

      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the new mouse position
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Check for intersection with the photograph mesh
      const intersects = raycaster.intersectObject(this.mesh);

      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        this.adjustRotationBasedOnHover(intersectionPoint);
      }
    }
  }

  adjustRotationBasedOnHover(intersectionPoint) {
    const { camera } = Store.getState();

    const meshCenter = this.mesh.position.clone();
    const directionFromCenter = intersectionPoint.clone().sub(meshCenter).normalize();

    // Adjust the rotation based on the direction
    // You can tweak these values for a more subtle or exaggerated effect
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion).normalize().multiplyScalar(this.rightShift);
    const lookTarget = new THREE.Vector3().copy(camera.position).add(right);
    this.mesh.lookAt(lookTarget)
    this.mesh.rotation.x += directionFromCenter.x * 0.1;
    this.mesh.rotation.y += directionFromCenter.y * -0.1;
  }

  update() {
    const { scene, camera } = Store.getState();

    if (this.mesh) {
      if (this.lerp.alpha < 1) {
        this.lerp.alpha += 0.05;
        const easedAlpha = easeInOutCubic(this.lerp.alpha);
        this.mesh.position.lerpVectors(this.lerp.from, this.lerp.to, easedAlpha);

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion).normalize().multiplyScalar(this.rightShift);
        const lookTarget = new THREE.Vector3().copy(camera.position).add(right);
        this.mesh.lookAt(lookTarget)
        this.mesh.rotation.z += this.randomZRotation; 

      } else if (this.shouldRemove) {
        // Remove the mesh from the scene
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;

        // Unbind the mouse move event
        window.removeEventListener('mousemove', this.handleMouseMove.bind(this));

      } else {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion).normalize().multiplyScalar(1);

        // on larger screens move the photo slightly right to make room for text 
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion).normalize().multiplyScalar(this.rightShift);

        this.mesh.position.copy(camera.position).add(forward).add(right);

        // Make the mesh look at the camera
        // this.mesh.lookAt(camera.position);

      }
    }

  }
}
