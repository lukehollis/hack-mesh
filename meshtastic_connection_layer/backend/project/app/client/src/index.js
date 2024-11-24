import './main.css'
import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

import Store from './Store';
import EventManager from './EventManager';
import App from './components/App'



// log version
console.log("🌐🏛️ v0.0.25");

// Store
// Create App
Store.setState({ app: new App() });

// events
const eventManager = new EventManager();

// get store state for functions
const store = Store.getState();
const { app, camera, renderer, bloomLayer, sizes, scene, canvas, BLOOM_SCENE } = store;


// Check if the browser supports VR
// navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
//   if (supported) {
//     // Enable WebXR
//     renderer.xr.enabled = true;

//     // Create VR button
//     document.body.appendChild(VRButton.createButton(renderer));
//   }
// });

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height // Using the camera from the App class
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  if (app.post.bloomComposer) {
    app.post.bloomComposer.setSize(sizes.width, sizes.height);
  }
  app.post.composer.setSize(sizes.width, sizes.height); 
})


renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Animation
const animate = function() {
  // this is replace by renderer.setAnimationLoop(animate);
  // requestAnimationFrame(animate);

  store.app.update(); // Call update method from App class

  store.app.post.composer.render();

  if (store.app.spaceCustom) {
    store.app.spaceCustom.render();
  }
};

// Set up the onLoad event
store.loadingManager.onLoad = function () {
  const { inited } = Store.getState();
  
  if (!inited) {
    eventManager.startApp();
  }
};

// Set up other event handlers if needed
store.loadingManager.onProgress = function (url, loaded, total) {
  const { debugMode } = Store.getState();
  if (debugMode) {
    console.log('Loading file: ' + url + ' (' + loaded + '/' + total + ')');
  }

    // Calculate the percentage loaded
  const percentComplete = Math.floor((loaded / total) * 100);

  const loadingText = document.getElementById("loading-text-notification-percent")

  // Update the text content with the loading percentage
  loadingText.textContent =  percentComplete + '%';
};

// call animate function
// animate();
// insteadd for VR support, use this:
renderer.setAnimationLoop(animate);

