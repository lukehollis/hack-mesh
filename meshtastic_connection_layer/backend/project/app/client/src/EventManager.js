import * as THREE from 'three';

import Store from './Store';
import { Node } from './components/Nodes';


export default class EventManager {
  constructor() {
    const { app, canvas } = Store.getState();
    this.mouseDownPos = new THREE.Vector2();
    this.mouseUpPos = new THREE.Vector2();

    // Attach event listeners
    window.addEventListener('wheel', this.onCanvasScroll.bind(this));
    window.addEventListener('keydown', this.handleKeydown.bind(this));

    // ui
    document.getElementById("view-mode-button").addEventListener('click', app.cameraHandlers.toggleViewMode.bind(app.cameraHandlers));
    document.getElementById("full-screen-button").addEventListener('click', this.handleFullscreenToggle.bind(this));
    // document.getElementById("guide-toggle-button").addEventListener('click', this.handleGuideToggle.bind(this));
    // document.getElementById("free-explore-toggle-button").addEventListener('click', this.handleGuideToggle.bind(this));
    document.getElementById("audio-on-button").addEventListener('click', this.audioMute.bind(this));
    document.getElementById("audio-mute-button").addEventListener('click', this.audioTurnOn.bind(this));
    document.getElementById("loading-audio-on-button").addEventListener('click', this.audioMute.bind(this));
    document.getElementById("loading-audio-mute-button").addEventListener('click', this.audioTurnOn.bind(this));

    // pointer events
    canvas.addEventListener('mousemove', app.pointerHandlers.handleMouseMove);

    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // touch events
    canvas.addEventListener('touchmove', app.pointerHandlers.handleTouchMove.bind(app.pointerHandlers));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  _disableTouchMoveOnNextPrev() {
    const nextButton = document.getElementById("next-button");
    const prevButton = document.getElementById("prev-button");
    const buttons = [nextButton, prevButton];

    let touchStartY = 0;


    buttons.forEach(button => {
      button.addEventListener("touchstart", (e) => {
        // Store the position at the start of the touch event
        touchStartY = e.touches[0].clientY;
      }, { passive: false });

      button.addEventListener("touchmove", (e) => {
        const touchMoveY = e.touches[0].clientY;
        const deltaY = touchMoveY - touchStartY;

        if (deltaY > 0) {
          // User is trying to scroll down (or pull-to-refresh)
          e.preventDefault();
        }
      }, { passive: false });
    });
  }

  handleKeydown(event) {
    switch(event.key) {
      case '\\':
        this.toggleDebugMode();
        break;
    }
  }

  handleMouseDown(event) {
    this.mouseDownPos.x = event.clientX;
    this.mouseDownPos.y = event.clientY;
  }

  handleMouseUp(event) {
    const { app, viewMode } = Store.getState();
    
    this.mouseUpPos.x = event.clientX;
    this.mouseUpPos.y = event.clientY;

    const dx = this.mouseUpPos.x - this.mouseDownPos.x;
    const dy = this.mouseUpPos.y - this.mouseDownPos.y;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) { // Threshold to consider as a click, adjust as needed

      // WHILE DEBUGGING
      app.pointerHandlers.handleMouseClick(event);
    }
  }

  handleTouchStart(event) {
    if (event.touches.length > 0) {
      this.mouseDownPos.x = event.touches[0].clientX;
      this.mouseDownPos.y = event.touches[0].clientY;
    }
  }

  handleTouchEnd(event) {
    const { app } = Store.getState();
    if (event.changedTouches.length > 0) {
      this.mouseUpPos.x = event.changedTouches[0].clientX;
      this.mouseUpPos.y = event.changedTouches[0].clientY;

      const dx = this.mouseUpPos.x - this.mouseDownPos.x;
      const dy = this.mouseUpPos.y - this.mouseDownPos.y;

      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        app.pointerHandlers.handleTouchTap(event);
      }
    }
  }

  onCanvasScroll(event) {
    const { app, viewMode } = Store.getState();
    

    if (viewMode === "FPV") {
      const direction = event.deltaY > 0 ? -1 : 1;
      const zoomSpeed = 10;

      app.cameraHandlers.handleZoom(direction * zoomSpeed);
    }
  }


  toggleDebugMode() {
    const { debugMode, app } = Store.getState();
    Store.setState({ debugMode: !debugMode });

    app.dollhouse.handleToggleDebugMode();
    app.nodes.handleToggleDebugMode();
    app.envCube.handleToggleDebugMode();
    app.debugInfo.handleToggleDebugMode();
  }


  handleFullscreenToggle() {
    // Check if the document is currently in fullscreen mode
    const isFullscreen = document.fullscreenElement || 
                          document.mozFullScreenElement || 
                          document.webkitFullscreenElement || 
                          document.msFullscreenElement;

    const fullscreenOnSVG = document.getElementById("full-screen-on");
    const fullscreenOffSVG = document.getElementById("full-screen-off");
    if (isFullscreen) {
      fullscreenOnSVG.classList.remove("hidden");
      fullscreenOffSVG.classList.add("hidden");
    } else {
      fullscreenOnSVG.classList.add("hidden");
      fullscreenOffSVG.classList.remove("hidden");
    }

    // Exit fullscreen mode if currently in fullscreen mode
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    } else { // Otherwise, enter fullscreen mode
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
    }

  }

  handleGuideToggle() {
    const { 
      space,
      app, 
      scene, 
      viewMode,
      currentNode,
      tourGuidedMode, 
      tourSpaceActiveIdx,
      tourPointActiveIdx,
    } = Store.getState();

    const tourUI = document.getElementById("tour-ui");
    const hudUI = document.getElementById("hud-container");
    const guideToggleButton = document.getElementById("guide-toggle-button");
    const freeExploreToggleButton = document.getElementById("free-explore-toggle-button");
    // const currentTourPoint = space.TOUR_DATA.tourmodels[tourSpaceActiveIdx].tourpoints[tourPointActiveIdx];
    const currentTourPoint = null;

    if (tourGuidedMode) {
      // turn off guided tour mode
      tourUI.classList.add("hidden")
      hudUI.classList.remove("hidden");
      app.sceneGraph.hideAllModels();
      app.setLightIntensity(1.6);

      if (app.rig.flashlight) {
        app.rig.flashlight.hide();
      }

      if (app.dust) {
        app.dust.disable();
      }

      app.rig.skybox.turnOffFog();
      app.envCube.toggleMaterialType();
      app.envCube.annotationGraph.hideAllAnnotations(100);
      app.tourUI.tourNavButtons.setLightMode(false);
      
      if (app.photograph) {
        app.photograph.slideOut();
      }

      guideToggleButton.classList.add("hidden");
      freeExploreToggleButton.classList.remove("hidden");

      if (viewMode === "ORBIT") {
        app.cameraHandlers.handleNavigation(currentNode, {
          viewMode: "FPV", 
        });
      }

    } else {
      // turn on guided tour mode
      tourUI.classList.remove("hidden")
      hudUI.classList.add("hidden");
      app.setLightIntensity(1.6);

      if (app.rig.flashlight) {
        app.rig.flashlight.show();
      }

      if (app.dust) {
        app.dust.enable();
      }

      app.rig.skybox.turnOnFog();
      app.envCube.toggleMaterialType(false);
      if (currentTourPoint.overlays) {
        for (let i = 0; i < currentTourPoint.overlays.length; i++) {
          app.envCube.annotationGraph.showAnnotationById(currentTourPoint.overlays[i]);
        }
      }

      guideToggleButton.classList.remove("hidden");
      freeExploreToggleButton.classList.add("hidden");
    }

    Store.setState({ tourGuidedMode: !tourGuidedMode });
  }

  startApp() {
    const { app, currentNode, isMobile, setFloormarkerHeights } = Store.getState();

    // sound fx
    // app.audioManager.playSound("start");

    // fade out loading screen
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("loading-hidden");
    loadingScreen.addEventListener("transitionend", function () {
      loadingScreen.style.display = "none";
    }, { once: true });


    Store.setState({ inited: true });

    if (app.spaceCustom) {
      app.spaceCustom.onLoad();
    }

    // allow time for loading screen to fade out
    setTimeout(() => {

      app.preloadNearestNodes(currentNode);
      if (setFloormarkerHeights) {
        app.nodes.updateFloorMarkerPositions();
      }
      // transparencies? 
      app.nodes.handleToggleViewMode();

    }, 300);
  }

  startFreeExplore() {
    const { app, } = Store.getState();
    
    const loadingScreen = document.getElementById("loading-screen");

    // toggle the guide off for free explore mode
    this.handleGuideToggle();

    // sound fx
    // app.audioManager.playSound("start");

    // fade out loading screen 
    loadingScreen.classList.add("loading-hidden");
    loadingScreen.addEventListener("transitionend", function () {
      loadingScreen.style.display = "none";
    }, { once: true });

    // cleanup loading dust
    app.loadingDust.destroy();
  }

  audioTurnOn() {
    const { app, } = Store.getState();
    const audioOnButton = document.getElementById("audio-on-button");
    const audioMuteButton = document.getElementById("audio-mute-button");
    const audioOnButtonLoading = document.getElementById("loading-audio-on-button");
    const audioMuteButtonLoading = document.getElementById("loading-audio-mute-button");

    app.audioManager.muteAll(false);
    audioOnButton.classList.remove("hidden");
    audioMuteButton.classList.add("hidden");
    audioOnButtonLoading.classList.remove("hidden");
    audioMuteButtonLoading.classList.add("hidden");
  }

  audioMute() {
    const { app, } = Store.getState();
    const audioOnButton = document.getElementById("audio-on-button");
    const audioMuteButton = document.getElementById("audio-mute-button");
    const audioOnButtonLoading = document.getElementById("loading-audio-on-button");
    const audioMuteButtonLoading = document.getElementById("loading-audio-mute-button");

    app.audioManager.muteAll(true);
    audioOnButton.classList.add("hidden");
    audioMuteButton.classList.remove("hidden");
    audioOnButtonLoading.classList.add("hidden");
    audioMuteButtonLoading.classList.remove("hidden");
  }
}


