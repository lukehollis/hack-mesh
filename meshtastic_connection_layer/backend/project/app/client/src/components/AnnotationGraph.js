import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as dat from 'dat.gui';

import Store from '../Store';



const annotationData = {
  type: 'group',
  id: 'root',
  position: [0, 0, 0],
  children: [],
};


const getFileType = (fileUrl) => {
  // Define known extensions for images and videos
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'webm', 'ogv'];

  // Extract the file extension
  const extension = fileUrl.split('.').pop().toLowerCase();

  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else {
    return 'unknown'; // Handle as needed
  }
}



class Annotation {
  constructor({ id, file, position, rotation, scale }) {
    this.id = id;
    this.file = file;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.isAnnotation = true;
    this.isVideo = false;

    this.createOverlayFace();
    // this.initTransformControls();
  }

  createOverlayFace() {
    const fileType = getFileType(this.file);

    const overlayPlane = new THREE.PlaneGeometry(1, 1);

    if (fileType === 'image') {
      // Handle image
      const loader = new THREE.TextureLoader();
      loader.load(this.file, (texture) => {
        this.overlayMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          depthTest: true,
        });
        this.createMesh(overlayPlane, this.overlayMaterial);
      });
    } else if (fileType === 'video') {
      this.isVideo = true;

      // Handle video
      const video = document.createElement('video');
      video.src = this.file;
      video.crossOrigin = 'anonymous'; 
      video.load();
      video.loop = true;
      video.setAttribute('id', this.id); 
      video.volume = 0.5;
      video.setAttribute('playsinline', ''); // Advise against going fullscreen on play
      video.setAttribute('webkit-playsinline', ''); // For iOS webkit browsers

      // Append video to the document body
      document.body.appendChild(video);
      video.style.display = 'none';

      const videoTexture = new THREE.VideoTexture(video);
      this.overlayMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        depthTest: true,
      });
      this.createMesh(overlayPlane, this.overlayMaterial);
    } else {
      console.warn('Unsupported file type:', this.file);
      // Handle unknown or unsupported file types as needed
    }
  }

  createMesh(geometry, material) {
    const { scene } = Store.getState();
    const position = this.position;
    const rotation = this.rotation;
    const scale = this.scale;

    this.overlay = new THREE.Mesh(geometry, material);
    this.overlay.rotation.set(rotation.x, rotation.y, rotation.z);
    this.overlay.position.set(position.x, position.y, position.z);
    this.overlay.scale.set(scale.x, scale.y, scale.z);
    this.overlay.renderOrder = 10;
    this.overlay.annotation = this;
    scene.add(this.overlay);
  }

  toggleFade() {
    const { app } = Store.getState();
    this.fadeIn(2000, () => {
      setTimeout(() => {
        this.fadeOut(2000, () => {
          setTimeout(() => {
            this.toggleFade();
          }, 500);
        });
      }, 500);
    });
  }

  fadeIn(duration = 600, callback) {
    const { app } = Store.getState();
    let progress = 0;

    // exception for sunrise
    // if (this.id === "ra-khepri-wall6") {
    //   this.slideToPosition();
    // }


    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;
      if (this.overlayMaterial) {
        this.overlayMaterial.opacity = 1 * factor;
      }

      if (progress >= duration) {

        clearInterval(interval);
        if (this.isVideo) {
          const vidElem = document.getElementById(this.id);
          vidElem.play();
        }

        if (callback) callback();
      }
    }, 20);

  }

  fadeOut(duration = 600, callback) {
    const { app } = Store.getState();
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      const factor = 1 - (progress / duration);
      if (this.overlayMaterial) {
        this.overlayMaterial.opacity = factor;
      }
      const bgOpacity = 1 - factor;

      if (progress >= duration) {
        clearInterval(interval);
        if (this.isVideo) {
          const vidElem = document.getElementById(this.id);
          vidElem.pause();
        }

        if (callback) callback();
      }
    }, 20);
  }

  slideToPosition(duration = 6000, callback) {
    const position = this.position;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      const factor = 1 - (progress / duration);

      this.overlay.position.lerpVectors(new THREE.Vector3(position[0], position[1], position[2]+0.01), new THREE.Vector3(position[0], position[1]-20, position[2]+0.01), factor)

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  switchMaterial(type) {
    if (!this.overlayMaterial.map) {
      console.warn('Texture not loaded yet.');
      return;
    }
  }

  onMouseEnter() {
    const { tourGuidedMode } = Store.getState();

    if (this.isVideo && !tourGuidedMode) {
      const vidElem = document.getElementById(this.id);
      vidElem.play();
      setTimeout(() => {
        vidElem.pause();
      }, 100000);
    }
  }

  onMouseLeave() {
    if (this.isVideo) {
      const vidElem = document.getElementById(this.id);
      // vidElem.pause();
    }
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

        console.log(`Annotation ${this.id} Position:`, worldPosition.x, worldPosition.y, worldPosition.z);

        const rotation = this.transformControls.object.rotation;
        const scale = this.transformControls.object.scale;

        console.log(`Annotation ${this.id} Rotation:`, rotation.x, rotation.y, rotation.z);
        console.log(`Annotation ${this.id} Scale:`, scale.x, scale.y, scale.z);
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
    if (this.overlay && this.transformControls) {
      this.transformControls.attach(this.overlay);
    }
  }

  detachFromTransformControls() {
    if (this.transformControls) {
      this.transformControls.detach();
    }
  }

}

export default class AnnotationGraph {
  constructor() {
    const { isMobile, space } = Store.getState();

    this.annotationLookup = {}; // This will store annotations by their id
    this.annotationData = annotationData;
    this.annotationData.children = space.data.tour_data.annotationGraph;
    
    this.buildAnnotationGraph(this.annotationData);
  }


  buildAnnotationGraph(node, parent = null) {
    const { scene } = Store.getState();

    if (node.type === 'group') {
      const group = new THREE.Group();
      group.position.set(...(node.position || [0, 0, 0]));
      node.children.forEach(childNode => this.buildAnnotationGraph(childNode, group));
      scene.add(group);
      this.annotationLookup[node.id] = group; 
    } else if (node.type === 'annotation') {
      const annotation = new Annotation(node);
      this.annotationLookup[node.id] = annotation; 
      Store.getState().annotations.push(annotation.overlay);
    }
  }

  getAnnotationById(id) {
    return this.annotationLookup[id];
  }

  showAnnotationById(id) {
    const annotation = this.annotationLookup[id];
    if (annotation) {
      annotation.fadeIn();
    } else {
      console.warn(`Annotation with id ${id} not found.`);
    }
  }

  hideAnnotationById(id) {
    const annotation = this.annotationLookup[id];
    if (annotation) {
      annotation.fadeOut();
    } else {
      console.warn(`Annotation with id ${id} not found.`);
    }
  }

  // Hide all annotations
  hideAllAnnotations(duration=600) {
    Object.keys(this.annotationLookup).forEach(id => {
      const annotation = this.annotationLookup[id];
      if (annotation && typeof annotation.fadeOut === 'function') {
        annotation.fadeOut(duration);
      }
    });
  }

  showAllAnnotations(duration=600) {
    Object.keys(this.annotationLookup).forEach(id => {
      const annotation = this.annotationLookup[id];
      if (annotation && typeof annotation.fadeIn === 'function') {
        annotation.fadeIn(duration);
      }
    });
  }

  showAllForNodeId(nodeId) {
    // Iterate through all annotations
    Object.keys(this.annotationLookup).forEach(id => {
      const annotation = this.annotationLookup[id];
      
      // Check if the annotation has a nodeId and if it matches the given nodeId
      if (annotation && annotation.nodeId === nodeId) {
        // If it matches, fade the annotation in
        annotation.fadeIn();
      } else {
        if (typeof annotation.fadeOut === 'function') {
          // If it doesn't match, fade the annotation out
          annotation.fadeOut();
        }
      }
    });
  }

}