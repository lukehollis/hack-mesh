import * as THREE from 'three';


import Store from './Store';
import { areVector3Equal } from './lib/util';

const lerp = (start, end, t) => {
  return start + (end - start) * t;
}




export default class CameraHandlers {

  constructor() {
  }

  handleNavigation(node, options={ 
    viewMode: "FPV",
    orbitTarget: null, 
    distance: 10,
    position: null,
    rotation: null,
    noDollhouse: false,
  }) {

    const { 
      currentNode, outgoingNode, app, 
      isNavigating, viewMode, orbitControlsTarget,
      camera, debugMode, tourLightMode,
    } = Store.getState();

    if (debugMode) {
      console.log("Navigating:", node, options);
    }

    // dont need to navigate if at current nav point
    if (
      (
          viewMode === "FPV" 
        && options.viewMode === "FPV" 
        && node.uuid === currentNode.uuid 
        && !options.position 
        && !options.rotation
        )
      ) {

      return;
    }

    // dont navigate if currently navigating between points 
    if (isNavigating) return;

    let newOrbitTarget;

    // if there is a custom orbit target set, navigate to that target (i.e. model or feature)
    if (options.orbitTarget) {
      // set custom target
      newOrbitTarget = options.orbitTarget;

    } else {
      // Create a new vector to store the world position
      newOrbitTarget = new THREE.Vector3();
      node.group.getWorldPosition(newOrbitTarget);
    }

    // as needed set new navpoint target 
    Store.setState({ 
      orbitControlsTarget: newOrbitTarget, 
    });

    // as needed update current nav point
    if (node.uuid !== currentNode.uuid) {
      Store.setState({ 
        outgoingNode: currentNode,
        currentNode: node,
      });
    }

    // update active floormarker
    app.nodes.nodes.find(n => n.uuid === currentNode.uuid).floormarkerSetActive(false);
    app.nodes.nodes.find(n => n.uuid === node.uuid).floormarkerSetActive(true);

    // handle navigation for the navpoint 
    let lerpTarget = newOrbitTarget;
    let lookTarget = newOrbitTarget;
    let distance = 0.1;
    let rotation = null;

    // calculate distance option
    if (options.distance) {
      distance = options.distance;
    }

    // calculate position option
    if (options.position) {
      lerpTarget = options.position;
    }

    if (options.rotation) {
      const azimuth = options.rotation.azimuth;
      const polar = options.rotation.polar;

      rotation = {
        azimuth,
        polar,
      };
    }

    if (options.viewMode !== viewMode) {
      // toggle the view mode but don't lerp b/c will set manually in next step
      this.setViewMode(options.viewMode, { doLerp: false, noDollhouse: options.noDollhouse });
    }

    // If outgoing view mode is orbit, just fade in the new envCube
    if (viewMode === "ORBIT") {
      app.envCube.envCube.node = node;
      app.envCube.envCube.updateFaces();
    }

    // lerp to new point
    app.rig.setLerpTarget(lerpTarget, rotation); 

    // Update the texture in the EnvCube
    if (viewMode === "FPV" && node.uuid !== currentNode.uuid) {
      app.envCube.crossfade();
    }
    
  }

  toggleViewMode() {
    const { viewMode } = Store.getState();

    // Toggle between the modes
    const newMode = viewMode === "FPV" ? "ORBIT" : "FPV";
    this.setViewMode(newMode);
  }

  setViewMode(newMode="FPV", options={doLerp: true, noDollhouse: false }) {
    const { viewMode, app, camera, orbitControlsTarget } = Store.getState();
    
    // Update the UI
    const cubeSVG = document.getElementById("view-mode-fpv-icon");
    const walkSVG = document.getElementById("view-mode-orbit-icon");
    if (newMode === "FPV") {
      cubeSVG.classList.remove("hidden");
      walkSVG.classList.add("hidden");
    } else {
      cubeSVG.classList.add("hidden");
      walkSVG.classList.remove("hidden");
    }

    let newCameraPosition = null;

    // Set new lerp target on the rig
    if (newMode === "FPV") {
      newCameraPosition = orbitControlsTarget.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-0.1));

      // reset fov
      camera.fov = 110;

    } else {
      newCameraPosition = orbitControlsTarget.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-10));

      // reset fov
      camera.fov = 80;
    }

    camera.updateProjectionMatrix();

    // Update the Store with the new mode
    Store.setState({
      viewMode: newMode, 
    });

    // lerp to new camera position 
    if (options.doLerp) {
      app.rig.setLerpTarget(newCameraPosition);
      Store.setState({ 
        cameraPosition: newCameraPosition, 
      });
    }

    // update the orbit controls for new View mode
    app.rig.updateOrbitControlsViewMode();

    // handle updating settings for viewing in different view mode
    if (options.noDollhouse) {
      app.dollhouse.hide();
    } else {
      app.dollhouse.handleToggleViewMode();
    }

    app.envCube.handleToggleViewMode();
    app.nodes.handleToggleViewMode();

    if (app.rig.flashlight) {
      // toggle flashlight
      if (newMode === "FPV") {
        // turn on flashlight
        app.rig.flashlight.show();
      } else {
        // turn on flashlight
        app.rig.flashlight.hide();
      }

    }
  }

  lerpToZoom(targetZoom) {
    const intervalTime = 20; // milliseconds
    const lerpSpeed = 0.05; // Adjust this for faster or slower transitions
    let lerpProgress = 0;

    const interval = setInterval(() => {
      const currentZoom = Store.getState().zoomLvl;
      const newZoom = lerp(currentZoom, targetZoom, lerpProgress);

      this.handleZoom(newZoom - currentZoom);

      lerpProgress += lerpSpeed;
      if (lerpProgress >= 1 || Math.abs(newZoom - targetZoom) < 1) {
        clearInterval(interval);
        this.handleZoom(targetZoom - newZoom); // Ensure exact zoom level
      }
    }, intervalTime);
  }


  handleZoom(zoomAmount) {
    let { camera, zoomLvl, fov, debugMode } = Store.getState();

    zoomLvl += zoomAmount;

    if (zoomLvl > 70) zoomLvl = 70;
    if (zoomLvl < 0) zoomLvl = 0;

    fov = 110 - zoomLvl;

    camera.fov = fov;
    camera.updateProjectionMatrix();

    if (debugMode) {
      console.log("zoomLvl", zoomLvl);
      console.log("fov", fov);
    }

    // Update the store with the new zoom level and fov
    Store.setState({ zoomLvl, fov });
  }
 }
