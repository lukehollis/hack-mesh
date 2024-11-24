import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TransformControls } from 'three/addons/controls/TransformControls.js';


import Store from '../Store';
import fragment from "../shaders/fragment_sketch.glsl";
import vertex from "../shaders/vertex_sketch.glsl";


class Model {
  constructor({ id, file, type, position, rotation, scale, isSketch }, light) {
    this.id = id;
    this.file = file;
    this.type = type;
    this.loader = new GLTFLoader();
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.isSketch = isSketch;
    this.light = light;


    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://static.mused.org/spaceshare/draco1.5.6/'); // Adjust this path to where your Draco scripts are located

    // Attach DracoLoader instance to GLTFLoader
    this.loader.setDRACOLoader(dracoLoader);


    this.mesh = null;
    this.renderOrder = 11;

    this.loader.load(this.file, this.handleLoad.bind(this));
  }

  handleLoad(gltf) {
    const { scene } = Store.getState();

    this.mesh = gltf.scene;
    this.mesh.name = this.id;

    // Destructure arrays to individual variables
    const [px, py, pz] = this.position;
    const [rx, ry, rz] = this.rotation;
    const [sx, sy, sz] = this.scale;

    // Set position, rotation, and scale here
    this.mesh.position.set(px, py, pz);
    this.mesh.rotation.set(rx, ry, rz);
    this.mesh.scale.set(sx, sy, sz);
    this.mesh.visible = false;
    this.mesh.renderOrder = this.renderOrder;
    let originalTexture = null;  // Variable to store the original texture from the glTF model

    if (this.isSketch) {
      this.material = new THREE.ShaderMaterial({
        extensions: {
          derivatives: "#extension GL_OES_standard_derivatives : enable"
        },
        side: THREE.FrontSide,
        uniforms: {
          time: { value: 0 },
          progressSketch: { value: this.isSketch ? 1.0 : 0.0, },
          progressColor: { value: this.isSketch ? 0.0 : 1.0, },
          imagetexture: { value: null, },
          noisetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/noise.jpg") },
          resolution: { value: new THREE.Vector4() },

        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
      });

      if (this.light) {
        this.material.uniforms.lightDirection = { value: this.light.position };
        this.material.uniforms.lightColor = { value: this.light.color };
        this.material.uniforms.lightIntensity = { value: this.light.intensity };
      }



      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // If the mesh's material has a map (texture), store it in originalTexture
          if (child.material.map) {
            originalTexture = child.material.map;
          }
          child.material = this.material;  // Set the custom shader material
        }
      });

      // If we've found a texture in the glTF model, assign it to the shader material's uniforms
      if (originalTexture && this.material.uniforms.imagetexture) {
        this.material.uniforms.imagetexture.value = originalTexture;
      }
    } else {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (this.id === "python") {
            child.material.depthTest = false;
            child.material.depthWrite = false;
            child.renderOrder = this.renderOrder;
            child.side = THREE.DoubleSide;

          }

          if (this.id === "temple2") {
            if (child.material.map) {
              originalTexture = child.material.map;
            }

            child.material = new THREE.MeshPhongMaterial({
              map: originalTexture,
            });

          }
        }
      });
    }

    scene.add(this.mesh);
    this.initTransformControls();
  }

  handleSketchReveal(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.material) {
        this.material.uniforms.progressSketch.value = factor;
      }

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  handleColorReveal(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.material) {
        this.material.uniforms.progressSketch.value = 1 - factor;
        this.material.uniforms.progressColor.value = factor;
      }

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  setPosition(x, y, z) {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }

    this.mesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }

    this.mesh.rotation.set(x, y, z);
  }

  setScale(x, y, z) {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }

    this.mesh.scale.set(x, y, z);
  }

  // Show the model
  show() {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }
    this.mesh.visible = true;
  }

  // Hide the model
  hide() {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }
    this.mesh.visible = false;
  }

  // Toggle visibility of the model
  toggleVisibility() {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }
    this.mesh.visible = !this.mesh.visible;
  }

  initTransformControls() {
    const { app, camera, canvas, scene } = Store.getState();
    this.transformControls = new TransformControls(camera, canvas);
    this.transformControls.addEventListener('change', () => {
      if (this.transformControls.object) {
        const position = this.transformControls.object.position;
        const rotation = this.transformControls.object.rotation;
        const scale = this.transformControls.object.scale;

        console.log('Position:', position.x, position.y, position.z);
        console.log('Rotation:', rotation.x, rotation.y, rotation.z);
        console.log('Scale:', scale.x, scale.y, scale.z);
      }
    });

    this.transformControls.addEventListener('dragging-changed', (event) => {
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
    if (this.mesh && this.transformControls) {
      this.transformControls.attach(this.mesh);
    }
  }

  detachFromTransformControls() {
    if (this.transformControls) {
      this.transformControls.detach();
    }
  }

  setCustomMaterial(material) {
    if (!this.mesh) {
      console.warn('Model not loaded yet.');
      return;
    }

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }
}

export default Model;
