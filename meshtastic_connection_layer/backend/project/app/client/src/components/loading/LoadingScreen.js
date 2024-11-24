import * as THREE from 'three';

import Store from '../../Store';

// shaders
import fragmentReveal from "../../shaders/fragment_reveal.glsl";
import vertexReveal from "../../shaders/vertex_reveal.glsl";
import fragmentRevealNotes from "../../shaders/fragment_reveal_notes.glsl";
import vertexRevealNotes from "../../shaders/vertex_reveal_notes.glsl";
import fragmentDust2D from "../../shaders/fragment_dust2d.glsl";
import vertexDust2D from "../../shaders/vertex_dust2d.glsl";


const dustColor = new THREE.Color("#afad94");

const textureLoader = new THREE.TextureLoader();

const loadTextureProgressively = (urls, material, uniformName) => {
  let index = 0;

  const onTextureLoad = (texture) => {
    material.uniforms[uniformName].value = texture;

    index++;

    if (index < urls.length) {
      textureLoader.load(urls[index], onTextureLoad);
    }
  };

  textureLoader.load(urls[index], onTextureLoad);
};





export default class LoadingScreen {
  constructor() {
    this.scene = new THREE.Scene();

    this.container = document.getElementById("loading-canvas");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.scene.background = new THREE.TextureLoader().load("https://iiif.mused.org/dig-notebook-paper-bg-v2.jpg/full/1200,/0/default.jpg")

    this.container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 1.7);
    this.sketchRevealCallbackCalled = false;

    this.resize();
    this.createObjects();
    this.render();
    this.setupResize();

    // init the load fx
    this.initLoadingScreen();
    // window.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    if (!this.container) return;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 853/1280;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.camera.updateProjectionMatrix();
  }

  createObjects() {
    // Create Shader Material
    this.matSketch = new THREE.ShaderMaterial({
      uniforms: {
        imagetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/ramessesi_tomb_loading_sketch_layer1_2.png") },
        progressReveal: { value: 0 },
        noisetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/noise.jpg") },
      },
      vertexShader: vertexReveal,
      fragmentShader: fragmentReveal,
      transparent: true,
      depthTest: false,
    });
    // Create Shader Material
    this.matNotes = new THREE.ShaderMaterial({
      uniforms: {
        imagetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/ramessesi_tomb_loading_sketch_layer2_4.png") },
        progressReveal: { value: 0 },
        noisetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/noise.jpg") },
        transitionColor: { value: new THREE.Vector4(1, 1, 1, 0.2) }, 
        transitionFactor: { value: 0.0 },
      },
      vertexShader: vertexRevealNotes,
      fragmentShader: fragmentRevealNotes,
      transparent: true,
      depthTest: false,
    });
    // Create Shader Material
    this.matPhoto = new THREE.ShaderMaterial({
      uniforms: {
        imagetexture: { value: new THREE.TextureLoader().load("https://iiif.mused.org/ramessesi_tomb_loading_photo3.jpg/full/100,/0/default.jpg") },
        progressReveal: { value: 0 },
        noisetexture: { value: new THREE.TextureLoader().load("https://static.mused.org/noise.jpg") },
      },
      vertexShader: vertexReveal,
      fragmentShader: fragmentReveal,
      transparent: true,
      depthTest: false,

    });

    loadTextureProgressively([
      "https://iiif.mused.org/ramessesi_tomb_loading_photo3.jpg/full/1000,/0/default.jpg",
      "https://iiif.mused.org/ramessesi_tomb_loading_photo3.jpg/full/3000,/0/default.jpg"
    ], this.matPhoto, 'imagetexture');

    // plane geo 
    // dimensions = 3262 x 2334
    // 1.4:1
    const width = 1.4 * 4;
    const height = 1 * 4;
    this.geometry = new THREE.PlaneGeometry(width, height, 1, 1);

    this.planeSketch = new THREE.Mesh(this.geometry, this.matSketch);
    this.planeSketch.renderOrder = 0;
    this.scene.add(this.planeSketch);

    this.planePhoto = new THREE.Mesh(this.geometry, this.matPhoto);
    this.planePhoto.position.set(-0.1, 0, 0);
    this.planePhoto.renderOrder = 1;
    this.scene.add(this.planePhoto);

    this.planeNotes = new THREE.Mesh(this.geometry, this.matNotes);
    this.planeNotes.position.set(-0.4, 0, 0);
    this.planeNotes.renderOrder = 2;
    this.scene.add(this.planeNotes);

    // geo dust
    // this.geoDust = new THREE.BufferGeometry();
    // const particleCount = 500;

    // const positions = new Float32Array(particleCount * 3); // 3 coordinates per point

    // for (let i = 0; i < positions.length; i += 3) {
    //   positions[i] = Math.random() * (2*width) - width;
    //   positions[i + 1] = Math.random() * (2*height) - height;
    //   positions[i + 2] = 0.1;
    // }

    // this.geoDust.setAttribute('position', new THREE.BufferAttribute(positions, 3));


    // // Create Shader Material
    // this.matDust = new THREE.ShaderMaterial({
    //   uniforms: {
    //     time: { value: 0 },
    //     color: { value: dustColor },
    //   },
    //   vertexShader: vertexDust2D,
    //   fragmentShader: fragmentDust2D,
    //   transparent: true,
    //   depthTest: false,
    // });

    // // this.matDust = new THREE.PointsMaterial({ color: dustColor, size: 0.05 });
    // this.pointsDust = new THREE.Points(this.geoDust, this.matDust);
    // this.pointsDust.renderOrder = 10;
    // this.scene.add(this.pointsDust);
  }

  handleSketchReveal(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.matSketch) {
        this.matSketch.uniforms.progressReveal.value = 2*factor; 
      }

      if (progress >= duration) {
        clearInterval(interval);
      }
        if (factor > 0.5 && !this.sketchRevealCallbackCalled) {
          this.sketchRevealCallbackCalled = true;
          callback();
        }
    }, 20);
  }

  handleNotesReveal(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.matSketch) {
        this.matNotes.uniforms.progressReveal.value = 2*factor; 
      }

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  handleNotesTransitionColor(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.matNotes) {
        this.matNotes.uniforms.transitionFactor.value = factor * 0.3; 
      }

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  handlePhotoReveal(callback) {
    const duration = 2000;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      if (this.matSketch) {
        this.matPhoto.uniforms.progressReveal.value = 2*factor; 
      }

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
    
  }

  textFadeIn() {
    const titleouter = document.getElementById("title-outer");
    const title = document.getElementById("loading-title");
    const title2 = document.getElementById("loading-title2");
    const subtitle = document.getElementById("loading-subtitle");

    titleouter.classList.add("animate__animated")
    titleouter.classList.add("animate__fadeIn");
    titleouter.classList.add("animate__fast");
    titleouter.classList.remove("opacity-0");

    setTimeout(() => {
      title.classList.add("animate__animated")
      title.classList.add("animate__fadeIn");
      title.classList.add("animate__fast");
    }, 500);

    setTimeout(() => {
      title2.classList.add("animate__animated")
      title2.classList.add("animate__fadeIn");
      title2.classList.add("animate__fast");
      this.textAnimateGlow(this._textAnimateGlow);
    }, 1000);

    setTimeout(() => {
      subtitle.classList.add("animate__animated")
      subtitle.classList.add("animate__fadeIn");
    }, 2000);

  } 

  buttonsFadeIn() {
    const loadingNotification = document.getElementById("loading-text-notification");
    loadingNotification.classList.remove("opacity-50")
    loadingNotification.classList.add("opacity-0")
    // loadingNotification.classList.add("animate__animated");
    // loadingNotification.classList.add("animate__fadeOut");

    const buttons = document.getElementById("loading-action-buttons");
    buttons.classList.add("animate__animated")
    buttons.classList.add("animate__fadeIn");

    this.buttonsRunDecryptFx();
  }

  buttonsRunDecryptFx() {}

  textAnimateGlow(callback) {
    const duration = 2000;
    let progress = 0;

    const titleOuter = document.getElementById("title-outer");

    const interval = setInterval(() => {
      progress += 20;
      const factor = progress / duration;

      titleOuter.style.textShadow = `0px 0px ${21*factor}px #c4bb9c`; 

      if (progress >= duration) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);    
  }

  _textAnimateGlow(callback) {
    const titleOuter = document.getElementById("title-outer");
    let time = 0;
    const interval = setInterval(() => {
      time += 0.3;
      const factor = 5 * Math.sin(time * Math.PI / 5);
      titleOuter.style.textShadow = `0px 0px ${21+factor}px #c4bb9c`; 
    }, 100);    
  }

  initLoadingScreen() {
    // first reveal bg
    // this.handleSketchReveal(this._initLoadingScreen.bind(this));
    setTimeout(() => {
      this.buttonsFadeIn();
    }, 2000);
  }

  _initLoadingScreen() {
    this.handleNotesReveal()

    setTimeout(() => {
      this.textFadeIn()
      this.handlePhotoReveal()
      this.handleNotesTransitionColor();
    }, 1500);

    setTimeout(() => {
      this.buttonsFadeIn()
    }, 5000);
  }

  destroy() {
    // 1. Remove Objects from Scene
    this.scene.remove(this.planeSketch, this.planePhoto, this.planeNotes, this.pointsDust);

    // 2. Dispose of Materials
    this.matSketch.dispose();
    this.matNotes.dispose();
    this.matPhoto.dispose();
    this.matDust.dispose();

    // 3. Dispose of Geometries
    this.geometry.dispose();
    this.geoDust.dispose();

    // 4. Dispose of Textures
    Object.values(this.matSketch.uniforms).forEach(uniform => uniform.value && uniform.value.dispose && uniform.value.dispose());
    Object.values(this.matNotes.uniforms).forEach(uniform => uniform.value && uniform.value.dispose && uniform.value.dispose());
    Object.values(this.matPhoto.uniforms).forEach(uniform => uniform.value && uniform.value.dispose && uniform.value.dispose());
    
    // 5. Remove Event Listeners
    window.removeEventListener("resize", this.resize.bind(this));
    // Unbind the mouse move event
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));

    // 6. Nullify References
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.container = null;
    // ... other properties ...

    this.isDestroyed = true;
  }

  handleMouseMove(event) {
    if (this.camera && this.planeSketch && this.planeNotes && this.planePhoto) {

      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Convert the mouse position to rotation angles.
      // Here we are defining how much the objects will rotate based on the mouse movement.
      const maxRotation = 0.005; // Define the max rotation in radians.
      const rotationX = -mouse.y * maxRotation;
      const rotationY = mouse.x * maxRotation;

      this.camera.rotation.x = rotationX;
      this.camera.rotation.y = rotationY;
    }
  }

  render() {
    if (this.isDestroyed) {
      return;
    }

    if (this.matDust) {
      this.matDust.uniforms.time.value += 0.0006;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
