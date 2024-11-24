import * as THREE from 'three';

import Photograph from '../Photograph';
import EarthTiles from '../EarthTiles';
import Birds from '../Birds';
import TourSceneCustom from './TourSceneCustom';

// global state
import Store from '../../Store';



const getModelWorldPosition = (modelTarget) => {

  const { space } = Store.getState();
  const sceneSettings = space.data.sceneSettings;

  // Create a matrix to represent the scene's transformations
  const sceneMatrix = new THREE.Matrix4();

  // Apply the scene's position offset
  const scenePosition = new THREE.Vector3(
    sceneSettings.offsetPosition.x,
    sceneSettings.offsetPosition.y,
    sceneSettings.offsetPosition.z
  );
  sceneMatrix.setPosition(scenePosition);

  // Apply the scene's rotation offset
  const sceneRotation = new THREE.Euler(
    THREE.MathUtils.degToRad(sceneSettings.offsetRotation.x),
    THREE.MathUtils.degToRad(sceneSettings.offsetRotation.y),
    THREE.MathUtils.degToRad(sceneSettings.offsetRotation.z),
    'XYZ'
  );
  sceneMatrix.makeRotationFromEuler(sceneRotation);

  // Get the model target's position
  const modelTargetPosition = new THREE.Vector3(
    modelTarget.position[0],
    modelTarget.position[1],
    modelTarget.position[2]
  );

  // Transform the initial nav point's position from local to world coordinates
  const worldPosition = modelTargetPosition.applyMatrix4(sceneMatrix);

  return worldPosition;
};


export default class TourNavButtons {
  constructor(app) {

    const { 
      tourSpaceActiveIdx, 
      tourPointActiveIdx, 
      space,
    } = Store.getState();

    const initialTourPoint = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints[tourPointActiveIdx];
    this.updateTourPointContent(initialTourPoint);
    this.preloadNextTourPointContent(app);

    // Attach event listeners
    document.getElementById("prev-button").addEventListener("click", this.handleClickPrev);
    document.getElementById("next-button").addEventListener("click", this.handleClickNext);
    
    if (initialTourPoint.extra === "map") {
      app.envCube.hide();
      app.dollhouse.hide();
      app.earthTiles = new EarthTiles();
    }

    this.tourSceneCustom = new TourSceneCustom();
  }

  _enablePrevButton = () => {
    const prevButton = document.getElementById("prev-button");
    prevButton.classList.remove("opacity-10");
    prevButton.classList.add("opacity-80");
    prevButton.classList.add("hover:opacity-100");
    prevButton.classList.add("cursor-pointer");
    prevButton.disabled = false;
  }

  _disablePrevButton = () => {
    const prevButton = document.getElementById("prev-button");
    prevButton.classList.add("opacity-10");
    prevButton.classList.remove("opacity-80");
    prevButton.classList.remove("hover:opacity-100");
    prevButton.classList.remove("cursor-pointer");
    prevButton.disabled = true;
  }

  _nextToLastButton = () => {
    const { space } = Store.getState();
    const nextButton = document.getElementById("next-button");
    nextButton.classList.add("bg-theme-100");
    nextButton.classList.add("hover:bg-theme-300");
    nextButton.classList.add("hover:border-theme-300");
    nextButton.classList.add("text-theme-800");
    nextButton.classList.add("font-sans-bold");
    nextButton.classList.add("px-16");
    nextButton.classList.remove("border-theme-100");
    nextButton.classList.remove("bg-transparent");
    nextButton.classList.remove("hover:bg-theme-800");
    nextButton.classList.remove("hover:border-theme-800");
    nextButton.classList.remove("text-white");
    nextButton.classList.remove("font-sans");
    nextButton.classList.remove("px-24");
    nextButton.textContent = "Continue Exploring"; 
  }

  _lastToNextButton = () => {
    const {
      tourLightMode,
      space,
    } = Store.getState();

    const nextButton = document.getElementById("next-button");
    nextButton.classList.remove("bg-theme-100");
    nextButton.classList.remove("hover:bg-theme-300");
    nextButton.classList.remove("hover:border-theme-300");
    nextButton.classList.remove("font-sans-bold");
    nextButton.classList.remove("px-16");
    nextButton.classList.add("border-theme-100");
    nextButton.classList.add("bg-transparent");
    nextButton.classList.add("hover:bg-theme-800");
    nextButton.classList.add("hover:border-theme-800");
    nextButton.classList.add("font-sans");
    nextButton.classList.add("px-24");

    if (tourLightMode) {
      nextButton.classList.remove("text-white");
      nextButton.classList.add("text-theme-800");
    } else {
      nextButton.classList.add("text-white");
      nextButton.classList.remove("text-theme-800");
    }

    // note: reimplement custom next button text if needed
    // nextButton.textContent = space.data.UI.nextButtonText;
    nextButton.textContent = "Next";
  }

  _handleNavigate = (newTourPointIdx) => {
    const {
      app,
      renderer,
      tourLightMode,
      tourSpaceActiveIdx, 
      tourPointActiveIdx,
      isNavigating,
      currentNode,
      space,
    } = Store.getState();

    // dont navigate if currently navigating between points 
    if (isNavigating) return;

    const tourPoints = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints;
    const nodes = space.data.nodes;

    // set the new tour point in the store
    Store.setState({ tourPointActiveIdx: newTourPointIdx });

    // control ui button states (erg was easier in react but at least full control with threejs this way)
    if (newTourPointIdx <= 0) {
      this._disablePrevButton();
    } else {
      this._enablePrevButton();
    }
    if (newTourPointIdx >= tourPoints.length - 1) { 
      this._nextToLastButton();
    } else {
      this._lastToNextButton();
    }

    // set the nav point text content
    const newTourPoint = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints[newTourPointIdx];
    const outgoingTourPoint = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints[tourPointActiveIdx];
    console.log("Tourpoint: ", newTourPointIdx, newTourPoint);

    // preload the next tour point (or check if loaded)
    this.preloadNextTourPointContent(app);

    /**
     *  special flashlight mobile handling
     **/
        // Check if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      Store.setState({ cursor: { position: new THREE.Vector3(), rotation: new THREE.Quaternion() } });
    }
  


    /**
     *  photographs 
     */

    // handle the photographs/medi
    if (outgoingTourPoint.files.length || app.photograph) {
      app.photograph.slideOut();
    }

    // fly in photograph/media if needed 
    if (newTourPoint.files.length) {
      app.photograph = new Photograph(newTourPoint.files[0]);
    }

    /**
     *  Update annotation overlays for tour points
     */

    // Assuming outgoingTourPoint.annotations and newTourPoint.annotations are arrays of annotation IDs
    const outgoingAnnotations = outgoingTourPoint.annotations || [];
    const incomingAnnotations = newTourPoint.annotations || [];

    // Annotations to hide are those in outgoingAnnotations not in incomingAnnotations
    const annotationsToHide = outgoingAnnotations.filter(annotation => !incomingAnnotations.includes(annotation));

    // Annotations to show are those in incomingAnnotations not in outgoingAnnotations
    const annotationsToShow = incomingAnnotations.filter(annotation => !outgoingAnnotations.includes(annotation));

    // Hide the outgoing annotations not present in the incoming point
    annotationsToHide.forEach(annotationId => {
      app.envCube.annotationGraph.hideAnnotationById(annotationId);
    });

    // Show the incoming annotations not present in the outgoing point
    annotationsToShow.forEach(annotationId => {
      app.envCube.annotationGraph.showAnnotationById(annotationId);
    });


    /**
     *  navigating sound fx
     */
    app.audioManager.playSound("navigate");
    app.audioManager.updateSoundsForTourPoint(newTourPoint.sounds, outgoingTourPoint.sounds);

    /**
     *  text content 
     */
    // update the tour point content
    this.updateTourPointContent(newTourPoint);

    /**
     *  zoom level 
     */
    // lerp zoom level 
    app.cameraHandlers.lerpToZoom(newTourPoint.zoom);

    /**
     *  custom game events 
     */
    let noDollhouse = false;
    let hideDollhouseOccluders = false;
    if (app.spaceCustom) {
      app.spaceCustom.handleChangeTourPoint(outgoingTourPoint, newTourPoint);
      this.tourSceneCustom.handleChangeTourPoint(outgoingTourPoint, newTourPoint);
    }

    /**
     *  navigation 
     */

    // do the navigation and view modes toggle
    if (newTourPoint.targetType === "NODE") {

      // if scene needs transition between target type
      if (tourLightMode) {
        // turn on flashlight
        app.rig.flashlight.show();

        // turn on dollhouse 
        if(noDollhouse) {
          app.dollhouse.hide({ hideOccluders: hideDollhouseOccluders });
        } else {
          app.dollhouse.show();
        }

        // turn off floor markers
        app.nodes.showFloorMarkers();

        // change ui colors for correct bg tone (sepia or black)
        this.setLightMode(false);
        app.setLightIntensity(1);

        // fade in model target in scene graph 
        app.sceneGraph.hideAllModels();
      }


      // navigate
      const targetData = app.nodes.nodes.find(np => np.uuid === newTourPoint.nodeUUID);
      app.cameraHandlers.handleNavigation(targetData, {
        viewMode: newTourPoint.viewMode,
        rotation: newTourPoint.rotation,
        noDollhouse,
      });

    } else if (newTourPoint.targetType === "MODEL") {

      // if scene needs transition between target type
      if (!tourLightMode) {
        // turn off flashlight
        app.rig.flashlight.hide();

        // turn off dollhouse 
        app.dollhouse.hide();

        // turn off floor markers
        // app.nodes.hideFloorMarkers();

        // change ui colors for correct bg tone (sepia or black)
        this.setLightMode();
        app.setLightIntensity(1.6);
      }

      // fade in model target in scene graph 
      app.sceneGraph.hideAllModels();
      for (let i = 0; i<newTourPoint.models.length; i++) {
        app.sceneGraph.showModelById(newTourPoint.models[i]);
      }

      // new orbit target is first model in list on guided tour point 
      // Lookup the model in the scene by id and compute its world position
      const model = app.sceneGraph.getModelById(newTourPoint.models[0]);
      const newOrbitTarget = new THREE.Vector3(model.position[0], model.position[1], model.position[2]);

      // new camera position
      const newPosition = new THREE.Vector3(newTourPoint.position.x, newTourPoint.position.y, newTourPoint.position.z);

      // lerp to position
      // Use the computed world position as the orbitTarget
      app.cameraHandlers.handleNavigation(currentNode, {
        viewMode: "ORBIT", 
        position: newPosition,
        orbitTarget: newOrbitTarget,  
      });

      // custom handling for model shader fx
      if (newTourPointIdx === 4) {
        const statue = app.sceneGraph.getModelById("paramessu-statue");
        statue.handleSketchReveal();

        // sketch reveal

      }
      if (newTourPointIdx === 5) {
        const statue = app.sceneGraph.getModelById("paramessu-statue");
        statue.handleColorReveal();
        // color reveal

      }

    }
  }

  preloadNextTourPointContent(app) {
    const { 
      tourSpaceActiveIdx, 
      tourPointActiveIdx, 
      space,
    } = Store.getState();

    const tourPoints = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints;
    const nodes = space.data.nodes;
    const tourPointToPreloadIdx = tourPointActiveIdx + 1;


    // don't load if it's past the final tour point
    if (tourPointToPreloadIdx >= tourPoints.length - 1) return;

    const tourPointToPreload = tourPoints[tourPointToPreloadIdx];
    const nodeToPreload = nodes.find(np => np.uuid === tourPointToPreload.nodeUUID);

    // load upcoming sounds
    for (let sound of tourPointToPreload.sounds) {
      app.audioManager.loadSound(sound);
    }

    // load upcoming annotations

    // don't preload if it's a map point
    if (!tourPointToPreload.nodeUUID.startsWith("map")) {
      app.loadNode(nodeToPreload);
    }
  }


  handleClickNext = () => {
    const {
      tourSpaceActiveIdx, 
      tourPointActiveIdx, 
      space,
    } = Store.getState();

    const tourPoints = space.data.tour_data.spaces[tourSpaceActiveIdx].tourpoints;
    let continueExploringLink = "https://mused.org/en/explore";
    if (space.data.continue_exploring_link && space.data.continue_exploring_link.length > 0) {
      continueExploringLink = space.data.continue_exploring_link;
    }

    if (tourPointActiveIdx < tourPoints.length - 1) {
      this._handleNavigate(tourPointActiveIdx + 1);
    } else if (tourPointActiveIdx === tourPoints.length - 1) {
      if (window.self !== window.top) {
        // Navigate the parent window
        window.parent.location.href = continueExploringLink;
      } else {
        // Navigate the current window, if it's not in an iframe
        window.location.href = continueExploringLink;
      }
    }
  }

  handleClickPrev = () => {
    const {
      tourSpaceActiveIdx, 
      tourPointActiveIdx, 
    } = Store.getState();

    if (tourPointActiveIdx > 0) {
      this._handleNavigate(tourPointActiveIdx - 1);
    }
  }

  // toggle between light text on dark bg and dark text on sepia bg
  setLightMode = (lightMode=true) => {
    const tourPointDisplay = document.getElementById("tour-ui-display");
    const tourPointContent = document.getElementById("tour-ui-content");
    const tourPointText = document.getElementById("tour-point-text");
    const nextButton = document.getElementById("next-button");
    const prevButton = document.getElementById("prev-button");

    const viewModeButton = document.getElementById("view-mode-button");
    const fullscreenButton = document.getElementById("full-screen-button");
    const audioOnButton = document.getElementById("audio-on-button");
    const audioMuteButton = document.getElementById("audio-mute-button");
    const guideToggleButton = document.getElementById("guide-toggle-button");
    const freeExploreToggleButton = document.getElementById("free-explore-toggle-button");
    const buttons = [
      fullscreenButton,
      audioOnButton,
      audioMuteButton,
      guideToggleButton,
      freeExploreToggleButton
    ];


    // set the new tour point in the store
    Store.setState({ tourLightMode: lightMode });

    if (lightMode) {
      tourPointContent.classList.add("text-theme-800");
      tourPointContent.classList.remove("text-white");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-l");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-r");
      tourPointDisplay.classList.remove("bg-gradient-to-t");
      
      tourPointText.style.textShadow = null; 
      tourPointText.style.background = "rgb(226 218 201)";

      nextButton.classList.add("border-theme-800");
      nextButton.classList.add("text-theme-800");
      nextButton.classList.remove("border-theme-100");
      nextButton.classList.remove("text-white");
      nextButton.classList.add("hover:text-white");

      prevButton.classList.add("text-theme-800");
      prevButton.classList.remove("text-white");

      viewModeButton.classList.add("text-theme-800");
      viewModeButton.classList.remove("text-white");
      viewModeButton.classList.remove("bg-black/20");
      viewModeButton.classList.remove("hover:bg-black/40");
      viewModeButton.classList.add("hover:bg-theme-800/10");
      viewModeButton.classList.add("hidden");

      // Loop through the buttons and add/remove classes
      buttons.forEach(button => {
        if (button) {
          button.classList.add("text-theme-800");
          button.classList.remove("text-white");
        }
      });

    } else {
      tourPointContent.classList.remove("text-theme-800");
      tourPointContent.classList.add("text-white");
      tourPointDisplay.classList.add("sm:bg-gradient-to-l");
      tourPointDisplay.classList.add("sm:bg-gradient-to-r");
      tourPointDisplay.classList.add("bg-gradient-to-t");
      
      tourPointText.style.textShadow = "0px 0px 5px #000"; 
      tourPointText.style.background = "transparent"; 

      nextButton.classList.remove("border-theme-800");
      nextButton.classList.remove("text-theme-800");
      nextButton.classList.add("border-theme-100");
      nextButton.classList.add("text-white");
      nextButton.classList.add("hover:bg-theme-800");
      nextButton.classList.remove("hover:text-white");

      prevButton.classList.remove("text-theme-800");
      prevButton.classList.add("text-white");

      viewModeButton.classList.remove("text-theme-800");
      viewModeButton.classList.add("text-white");
      viewModeButton.classList.add("bg-black/20");
      viewModeButton.classList.add("hover:bg-black/40");
      viewModeButton.classList.remove("hover:bg-theme-800/10");
      viewModeButton.classList.remove("hidden");

      // Loop through the buttons and add/remove classes
      buttons.forEach(button => {
        if (button) {
          button.classList.remove("text-theme-800");
          button.classList.add("text-white");
        }
      });

    }
  }

  updateTourPointContent = (newTourPoint) => {
    const {
      tourLightMode,
    } = Store.getState();

    const tourPointDisplay = document.getElementById("tour-ui-display");
    const tourPointContent = document.getElementById("tour-ui-content");
    const tourPointText = document.getElementById("tour-point-text");
    const tourPointTextMain = document.getElementById("tour-point-text-main");
    const tourPointTextSecondary = document.getElementById("tour-point-text-secondary");

    // update classes
    if (newTourPoint.textPosition === "center") {
      tourPointDisplay.classList.add("top-auto");
      tourPointDisplay.classList.add("right-0");
      tourPointDisplay.classList.add("left-0");
      tourPointDisplay.classList.remove("top-0");
      tourPointDisplay.classList.remove("right-auto");
      tourPointDisplay.classList.remove("left-auto");
      tourPointDisplay.classList.remove("h-full");
      tourPointDisplay.classList.remove("sm:w-1/2");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-l");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-r");
      tourPointDisplay.style.height = "50vh";

      tourPointContent.classList.add("right-auto");
      tourPointContent.classList.add("left-auto");
      tourPointContent.classList.add("sm:text-center");
      tourPointContent.classList.add("justify-center");
      tourPointContent.classList.remove("sm:right-0");
      tourPointContent.classList.remove("sm:right-auto");
      tourPointContent.classList.remove("sm:left-auto");
      tourPointContent.classList.remove("sm:left-0");
      tourPointContent.classList.remove("right-0");
      tourPointContent.classList.remove("left-0");
      tourPointContent.style.maxWidth = "none";

      tourPointText.classList.remove("md:text-xl");
      tourPointText.classList.add("md:text-2xl");
    } else if (newTourPoint.textPosition === "left") {
      tourPointDisplay.classList.remove("right-0");
      tourPointDisplay.classList.add("left-0");
      tourPointDisplay.classList.add("right-auto");
      tourPointDisplay.classList.remove("left-auto");
      tourPointDisplay.classList.add("sm:w-1/2");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-l");

      if (window.innerWidth > 640) {
        tourPointDisplay.classList.remove("top-auto");
        tourPointDisplay.classList.add("top-0");
        tourPointDisplay.classList.add("h-full");
        tourPointDisplay.style.height = `${window.innerHeight}px`;
      } else {
        tourPointDisplay.classList.add("top-auto");
        tourPointDisplay.classList.remove("top-0");
        tourPointDisplay.classList.remove("h-full");
        tourPointDisplay.style.height = "50vh";
      }

      // only add the bg gradient in dark mode
      if (!tourLightMode) {
        tourPointDisplay.classList.add("sm:bg-gradient-to-r");
      }

      tourPointContent.classList.remove("right-auto");
      tourPointContent.classList.remove("left-auto");
      tourPointContent.classList.remove("sm:text-center");
      tourPointContent.classList.remove("justify-center");
      tourPointContent.classList.remove("sm:right-0");
      tourPointContent.classList.add("sm:right-auto");
      tourPointContent.classList.remove("sm:left-auto");
      tourPointContent.classList.add("sm:left-0");
      tourPointContent.classList.add("right-0");
      tourPointContent.classList.add("left-0");
      tourPointContent.style.maxWidth = "30rem";

      tourPointText.classList.remove("md:text-2xl");
      tourPointText.classList.add("md:text-xl");
 
    } else if (newTourPoint.textPosition === "right") {
      tourPointDisplay.classList.add("right-0");
      tourPointDisplay.classList.remove("left-0");
      tourPointDisplay.classList.remove("right-auto");
      tourPointDisplay.classList.add("left-auto");
      tourPointDisplay.classList.add("sm:w-1/2");
      tourPointDisplay.classList.remove("sm:bg-gradient-to-r");
      tourPointDisplay.style.height = `${window.innerHeight}px`;

      if (window.innerWidth > 640) {
        tourPointDisplay.classList.remove("top-auto");
        tourPointDisplay.classList.add("top-0");
        tourPointDisplay.classList.add("h-full");
        tourPointDisplay.style.height = `${window.innerHeight}px`;
      } else {
        tourPointDisplay.classList.add("top-auto");
        tourPointDisplay.classList.remove("top-0");
        tourPointDisplay.classList.remove("h-full");
        tourPointDisplay.style.height = "50vh";
      }

      // only add the bg gradient in dark mode
      if (!tourLightMode) {
        tourPointDisplay.classList.add("sm:bg-gradient-to-l");
      }

      tourPointContent.classList.remove("right-auto");
      tourPointContent.classList.remove("left-auto");
      tourPointContent.classList.remove("sm:text-center");
      tourPointContent.classList.remove("justify-center");
      tourPointContent.classList.add("sm:right-0");
      tourPointContent.classList.remove("sm:right-auto");
      tourPointContent.classList.add("sm:left-auto");
      tourPointContent.classList.remove("sm:left-0");
      tourPointContent.classList.add("right-0");
      tourPointContent.classList.add("left-0");
      tourPointContent.style.maxWidth = "30rem";

      tourPointText.classList.remove("md:text-2xl");
      tourPointText.classList.add("md:text-xl");
    }

    // update content
    tourPointTextMain.innerHTML = newTourPoint.text.split('\n').map((paragraph) => {
        return `<p>${paragraph}</p>`;
      }).join('');

    tourPointTextMain.classList.add("opacity-0")
    tourPointTextSecondary.classList.remove("opacity-70");
    tourPointTextSecondary.classList.add("opacity-0");
    tourPointTextMain.classList.remove("animate__animated")
    tourPointTextMain.classList.remove("animate__fadeIn")
    tourPointTextSecondary.classList.remove("animate__animated");
    tourPointTextSecondary.classList.remove("animate__fadeIn");
    setTimeout(() => {
      tourPointTextMain.classList.remove("opacity-0")
      tourPointTextMain.classList.add("animate__animated")
      tourPointTextMain.classList.add("animate__fadeIn")
      setTimeout(() => {
        tourPointTextSecondary.classList.remove("opacity-0");
        tourPointTextSecondary.classList.add("opacity-70");
        tourPointTextSecondary.classList.add("animate__animated");
        tourPointTextSecondary.classList.add("animate__fadeIn");
      }, 600);
    }, 600);

    if (newTourPoint.secondaryText && newTourPoint.secondaryText.length) {
      tourPointTextSecondary.innerHTML = newTourPoint.secondaryText;
      tourPointTextSecondary.classList.add("sm:block");
      tourPointTextSecondary.classList.remove("hidden");
    } else {
      tourPointTextSecondary.innerHTML = "";
      tourPointTextSecondary.classList.remove("sm:block");
      tourPointTextSecondary.classList.add("hidden");
    }

  }

}