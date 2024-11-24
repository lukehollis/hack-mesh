import * as THREE from 'three';

// global state
import Store from '../Store';

// components
import Rig from './Rig';
import EnvCube from './EnvCube';
import Nodes from './Nodes';
import Dollhouse from './Dollhouse';
import Cursor from './Cursor';
import DebugInfo from './DebugInfo';
import Postprocessing from './Postprocessing'

// optional components for tour / game mode
import TourUI from './tour/TourUI';
import SceneGraph from './SceneGraph';
import AudioManager from './AudioManager';
import EarthTiles from './EarthTiles';
import Photograph from './Photograph';
import setupSpaceCustom from './spaceCustom';
import Dust from './Dust';
import Birds from './Birds';

// event handlers
import PointerHandlers from '../PointerHandlers';
import CameraHandlers from '../CameraHandlers';

// lib
import { useCachedTexture, calculateDistance, getInitialOrbitTarget } from '../lib/util';


function hasPass(composer, passType) {
  for (let i = 0; i < composer.passes.length; i++) {
    if (composer.passes[i] instanceof passType) {
      return true;
    }
  }
  return false;
}


export default class App {
  constructor() {
    // store
    const { scene, isMobile, tourGuidedMode } = Store.getState();

    // Camera
    this.rig = new Rig();

    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xeee6d7, 2.0);
    scene.add(ambientLight);
    this.ambientLight = ambientLight;
    this.targetIntensity = 2.0;
    this.currentIntensity = 2.0;
    this.lerpAlpha = 0;

    // The Cube with the Environment texture 
    this.envCube = new EnvCube();

    // Scene objects
    this.dollhouse = new Dollhouse();

    // The Cube with the Environment texture 
    this.nodes = new Nodes();

    // The cursor 
    this.cursor = new Cursor();

    // Handle Camera and Pointer
    this.cameraHandlers = new CameraHandlers();
    this.pointerHandlers = new PointerHandlers();

    // guided tour and creative mode stuff
    if (tourGuidedMode) {
      // audio manager must be before tour ui
      this.audioManager = new AudioManager();

      this.tourUI = new TourUI(this);

      this.sceneGraph = new SceneGraph();
      this.spaceCustom = setupSpaceCustom();
      // this.earthTiles = new EarthTiles();

      // fx
      // this.dust = new Dust();
      if (!isMobile) {
        // this.birds = new Birds();

      }

      this.setInitialTourCameraRotation();
    }

    // debugging
    this.debugInfo = new DebugInfo();

    // post
    // must be after lights are added
    this.post = new Postprocessing();

    // editing space and tour if relevant
    // this does not add overhead for public users
    this.setupEditing();
  } 

  preload() {
    // Preload initial texture and then initialize rest of the App
    // store
    const { currentNode } = Store.getState();

    this.loadNode(currentNode);
  }

  preloadNearestNodes(targetNode) {
    const { space, debugMode, isMobile } = Store.getState();
    const nodes = space.data.nodes;  

    if (debugMode) {
      console.log("Preloading nearest nodes for targetNode", targetNode)
    }

    // Exclude the current node and nodes starting with "map"
    const otherNodes = nodes.filter(node => node.uuid !== targetNode.uuid && !node.uuid.startsWith("map"));

    // Calculate distances and sort nodes by distance to the current node
    const sortedNodes = otherNodes
      .map(node => {
        const distance = calculateDistance(targetNode.position, node.position);
        if (debugMode) {
          console.log(`Distance from targetNode to node ${node.uuid}: ${distance}`);
        }
        return { node, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.node);


    // Preload the nearest 8 nodes
    let numberOfNodesToPreload = 14;
    if (isMobile) {
      numberOfNodesToPreload = 8;
    }
    const nearestNodes = sortedNodes.slice(0, numberOfNodesToPreload);
    nearestNodes.forEach(node => {
      this.loadNode(node);
    });
  }

  loadNode(node, callback=() => {}) {
    const { materialCache, loadingManager, space } = Store.getState();

    materialCache[node.uuid] = {};

    let loadedTexturesCount = 0;
    const totalTexturesToLoad = 6; // Assuming 6 faces

    // hack for bug with load node not working sometimes
    const timeoutBackup = setTimeout(() => {
      callback();
    }, 10000);

    // Function to check if all textures are loaded
    const checkAllTexturesLoaded = () => {
      if (loadedTexturesCount === totalTexturesToLoad) {
        timeoutBackup && clearTimeout(timeoutBackup);
        callback();
      }
    };

    Array.from({ length: 6 }).forEach((_, faceI) => {
      materialCache[node.uuid][faceI] = {};

      // load the 1024 version
      const texture = useCachedTexture(node.uuid, faceI, "1024", space.data.version, () => {
        loadedTexturesCount++;
        checkAllTexturesLoaded();
      });

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });

      materialCache[node.uuid][faceI]["1024"] = material;
    });

    Store.setState({materialCache: { [node.uuid]: materialCache[node.uuid], ...materialCache} });

    // If there are no textures to load, call the callback immediately
    if (totalTexturesToLoad === 0) {
      timeoutBackup && clearTimeout(timeoutBackup);
      callback();
    }

  }

  areAllFacesLoaded(node) {
    const { materialCache } = Store.getState();
    if (!node || !materialCache[node.uuid]) return false;

    for (let i = 0; i < 6; i++) { // Assuming there are 6 faces
      if (!materialCache[node.uuid][i] || !materialCache[node.uuid][i]["1024"]) {
        return false;
      }
    }
    return true;
  }

  ensureFacesLoadedThenNavigate(node, callback) {
    if (this.areAllFacesLoaded(node)) {

      this.cameraHandlers.handleNavigation(node, {
        viewMode: "FPV",
      });

    } else {
      const nodeLoadingScreen = document.getElementById("node-loading-screen");
      nodeLoadingScreen.classList.remove("hidden"); 

      this.loadNode(node, () => {
        // callback after loading:
        // hide loading screen
        nodeLoadingScreen.classList.add("hidden"); 

        if (this.areAllFacesLoaded(node)) {
          // perform navigation
          this.cameraHandlers.handleNavigation(node, {
            viewMode: "FPV",
          });

          // preload textures of nearest nodes
          this.preloadNearestNodes(node);

        } else {
          console.error("Loading had error:", node);

          // preload textures of nearest nodes
          this.preloadNearestNodes(node);

          // Handle the scenario where faces couldn't be loaded (e.g., show an error message)
          nodeLoadingScreen.classList.add("hidden"); 
        }
      });
    }
  }

  setLightIntensity(intensity) {
    this.targetIntensity = intensity;
    this.lerpAlpha = 0;   
  }

  // Call this function in your animation loop or in a setInterval
  updateLights() {
    if (this.lerpAlpha < 1) {
      this.lerpAlpha += 0.01; // Control the speed by changing this value
    }

    // Linearly interpolate between the current and target intensity
    this.currentIntensity = THREE.MathUtils.lerp(this.currentIntensity, this.targetIntensity, this.lerpAlpha);

    // Update the intensity of the ambient light
    this.ambientLight.intensity = this.currentIntensity;
  }

  setupEditing() {
    this.setupSpaceEdit();
    this.setupTourEdit();
  }

  setupSpaceEdit() {

      window.app = window.app || {};
      window.app.submitForm = () => {
        const { space, debugMode } = Store.getState();
        const nodes = space.data.nodes;  

        nodes.forEach(n => {
          // Find the node in this.nodes with the same uuid
          const thisNode = this.nodes.nodes.find(node => node.uuid === n.uuid);

          // If a node with a matching uuid is found, set n's floorPosition to thisNode's floorPosition
          if (thisNode) {
            n.floorPosition = thisNode.floormarker.group.position;
          }
        });

        // Set the value of the hidden input field
        document.getElementById('space_data_nodes').value = JSON.stringify({ nodes });
        
        // Submit the form
        document.getElementById('space_edit_form').submit();
      };
  }

  setupTourEdit() {

      window.app = window.app || {};
      window.app.submitFormTour = () => {
        const { space, } = Store.getState();

        const annotationGraph = space.data.tour_data.annotationGraph;
        Object.keys(this.envCube.annotationGraph.annotationLookup).forEach(id => {
          const annotation = this.envCube.annotationGraph.annotationLookup[id];
          annotationGraph.forEach(a => {
            if (a.id === annotation.id) {
              a.position = annotation.overlay.position;
              a.rotation = {
                x: annotation.overlay.rotation.x,
                y: annotation.overlay.rotation.y,
                z: annotation.overlay.rotation.z,
              };
              a.scale = annotation.overlay.scale;
            }
          });
        })

        const sceneGraph = [];

        // Set the value of the hidden input field
        document.getElementById('tour_data_input').value = JSON.stringify({ annotationGraph, sceneGraph });
        
        // Submit the form
        document.getElementById('tour_edit_form').submit();
      };
  }

  setInitialTourCameraRotation() {
    const { space } = Store.getState();

    const initialNode = space.data.nodes.find(node => node.uuid === space.data.tour_data.spaces[0].tourpoints[0].nodeUUID);
    const initialOrbitTarget = getInitialOrbitTarget(
            space.data, 
            initialNode,
        );
    this.rig.setLerpTarget(initialOrbitTarget, space.data.tour_data.spaces[0].tourpoints[0].rotation); 
  }

  update() {
    // manage fading in and out the light
    this.updateLights();

    this.rig.update();
    this.envCube.update();
    this.cursor.update();
    this.nodes.update();

    this.debugInfo.update();

    // conditional  
    if (this.photograph) {
      this.photograph.update();
    }

    if (this.spaceCustom) {
      this.spaceCustom.update();
    }

    if (this.loadingScreen) {
      this.loadingScreen.render();
    }

    if (this.birds) {
      this.birds.update();
    }

    if (this.dust) {
      this.dust.update();
    }

    if (this.earthTiles) {
      this.earthTiles.update();
    }
  }

}
