
import * as THREE from 'three';
import Store from '../../Store';

export default class TourSceneCustom {
  constructor(app) {
  }

  handleChangeTourPoint(outgoingTourPoint, newTourPoint) {
    let starsShouldHide = !(newTourPoint.extra);
    const viewModeButton = document.getElementById("view-mode-button");

    // if (app.cutsceneBackground) {
    //   if (outgoingTourPoint.extra === "startCutsceneSunset" && newTourPoint.extra === "preCutsceneSunset") {
    //     app.envCube.fadeIn(app.cutsceneBackground.setVisible(false));
    //     app.rig.flashlight.show();
    //     renderer.toneMappingExposure = 1.4; 
    //     app.audioManager.crossfade("sunset", "default");
    //     app.post.turnOffGodRays();
    //     app.dollhouse.showOccluders();

    //     const boatAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-solar-boat-wall2");
    //     const apophisAnnotation = app.envCube.annotationGraph.getAnnotationById("apophis-wall2");
    //     const atumAnnotation = app.envCube.annotationGraph.getAnnotationById("atum-wall2");
    //     boatAnnotation.switchMaterial("PHONG");
    //     apophisAnnotation.switchMaterial("PHONG");
    //     atumAnnotation.switchMaterial("PHONG");
    //     app.cutsceneBackground.stars.hideAll();
    //     viewModeButton.classList.remove("hidden");

    //   } else if (outgoingTourPoint.extra === "preCutsceneSunset" && newTourPoint.extra === "startCutsceneSunset") {
    //     app.cutsceneBackground.setVisible(true);
    //     app.cutsceneBackground.transitionSunsetToNight();
    //     app.rig.flashlight.hide();
    //     app.envCube.fadeOut();
    //     app.audioManager.crossfade("default", "sunset");
    //     app.post.turnOnGodRays();
    //     app.dollhouse.hide({hideOccluders: true});
    //     hideDollhouseOccluders = true;
    //     noDollhouse = true;
    //     const boatAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-solar-boat-wall2");
    //     const apophisAnnotation = app.envCube.annotationGraph.getAnnotationById("apophis-wall2");
    //     const atumAnnotation = app.envCube.annotationGraph.getAnnotationById("atum-wall2");
    //     boatAnnotation.switchMaterial("BASIC");
    //     apophisAnnotation.switchMaterial("BASIC");
    //     atumAnnotation.switchMaterial("BASIC");
    //     app.cutsceneBackground.stars.startFadeIn();
    //     starsShouldHide = false;
    //     viewModeButton.classList.add("hidden");


    //   } else if (outgoingTourPoint.extra === "endCutsceneSunset" && newTourPoint.extra === "duringCutsceneSunset") {
    //     app.cutsceneBackground.setVisible(true);
    //     app.cutsceneBackground.transitionSunsetToNight();
    //     app.rig.flashlight.hide();
    //     app.envCube.fadeOut();
    //     app.audioManager.crossfade("default", "sunset");
    //     app.post.turnOnGodRays();
    //     app.dollhouse.hide({hideOccluders: true});
    //     hideDollhouseOccluders = true;
    //     noDollhouse = true;
    //     const boatAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-solar-boat-wall2");
    //     const apophisAnnotation = app.envCube.annotationGraph.getAnnotationById("apophis-wall2");
    //     const atumAnnotation = app.envCube.annotationGraph.getAnnotationById("atum-wall2");
    //     boatAnnotation.switchMaterial("BASIC");
    //     apophisAnnotation.switchMaterial("BASIC");
    //     atumAnnotation.switchMaterial("BASIC");

    //     app.cutsceneBackground.stars.startFadeIn();
    //     starsShouldHide = false;
    //     viewModeButton.classList.add("hidden");



    //   } else if (outgoingTourPoint.extra === "duringCutsceneSunset" && newTourPoint.extra === "endCutsceneSunset") {
    //     app.envCube.fadeIn(app.cutsceneBackground.setVisible(false));
    //     app.rig.flashlight.show();
    //     renderer.toneMappingExposure = 1.4; 
    //     app.audioManager.crossfade("sunset", "default");
    //     app.post.turnOffGodRays();
    //     app.dollhouse.showOccluders();
    //     const boatAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-solar-boat-wall2");
    //     const apophisAnnotation = app.envCube.annotationGraph.getAnnotationById("apophis-wall2");
    //     const atumAnnotation = app.envCube.annotationGraph.getAnnotationById("atum-wall2");
    //     boatAnnotation.switchMaterial("PHONG");
    //     apophisAnnotation.switchMaterial("PHONG");
    //     atumAnnotation.switchMaterial("PHONG");
    //     app.cutsceneBackground.stars.hideAll();
    //     viewModeButton.classList.remove("hidden");

    //   } 

    //   // sunrise
    //   if (outgoingTourPoint.extra === "startCutsceneSunrise" && newTourPoint.extra === "preCutsceneSunrise") {
    //     app.envCube.fadeIn(app.cutsceneBackground.setVisible(false));
    //     renderer.toneMappingExposure = 1.4; 
    //     app.rig.flashlight.show();
    //     // app.dollhouse.dustParticles.resetColor();
    //     app.dollhouse.showOccluders();
    //     app.audioManager.crossfade("sunrise", "default");
    //     app.post.turnOffGodRays();
    //     const khepriAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-khepri-wall6");
    //     khepriAnnotation.switchMaterial("PHONG");
    //     app.cutsceneBackground.stars.hideAll();
    //     viewModeButton.classList.remove("hidden");


    //   } else if (outgoingTourPoint.extra === "preCutsceneSunrise" && newTourPoint.extra === "startCutsceneSunrise") {
    //     app.cutsceneBackground.setVisible(true);
    //     app.cutsceneBackground.transitionNightToSunrise();
    //     app.envCube.fadeOut();
    //     app.rig.flashlight.hide();
    //     // app.dollhouse.dustParticles.setLightPink();
    //     app.audioManager.crossfade("default", "sunrise");
    //     app.post.turnOnGodRays();
    //     app.dollhouse.hide({hideOccluders: true});
    //     hideDollhouseOccluders = true;
    //     noDollhouse = true;
    //     const khepriAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-khepri-wall6");
    //     khepriAnnotation.switchMaterial("BASIC");

    //     app.cutsceneBackground.stars.showAll();
    //     app.cutsceneBackground.stars.startFadeOut();
    //     starsShouldHide = false;
    //     viewModeButton.classList.add("hidden");




    //   } else if (outgoingTourPoint.extra === "endCutsceneSunrise" && newTourPoint.extra === "startCutsceneSunrise") {
    //     app.cutsceneBackground.setVisible(true);
    //     app.cutsceneBackground.transitionNightToSunrise();
    //     app.envCube.fadeOut();
    //     app.rig.flashlight.hide();
    //     // app.dollhouse.dustParticles.setLightPink();
    //     app.audioManager.crossfade("default", "sunrise");
    //     app.post.turnOnGodRays();
    //     app.dollhouse.hide({hideOccluders: true});
    //     hideDollhouseOccluders = true;
    //     noDollhouse = true;
    //     const khepriAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-khepri-wall6");
    //     khepriAnnotation.switchMaterial("BASIC");

    //     app.cutsceneBackground.stars.showAll();
    //     app.cutsceneBackground.stars.startFadeOut();
    //     starsShouldHide = false;
    //     viewModeButton.classList.add("hidden");



    //   } else if (outgoingTourPoint.extra === "startCutsceneSunrise" && newTourPoint.extra === "endCutsceneSunrise") {
    //     app.envCube.fadeIn(app.cutsceneBackground.setVisible(false));
    //     renderer.toneMappingExposure = 1.4; 
    //     app.rig.flashlight.show();
    //     // app.dollhouse.dustParticles.resetColor();
    //     app.dollhouse.showOccluders();
    //     app.audioManager.crossfade("sunrise", "default");
    //     app.post.turnOffGodRays();
    //     const khepriAnnotation = app.envCube.annotationGraph.getAnnotationById("ra-khepri-wall6");
    //     khepriAnnotation.switchMaterial("PHONG");
    //     app.cutsceneBackground.stars.hideAll();
    //     viewModeButton.classList.remove("hidden");

    //   }

    //   if (!newTourPoint.extra && !outgoingTourPoint.extra) {
    //     renderer.toneMappingExposure = 1.4; 
    //   }

    //   if (starsShouldHide) {
    //     app.post.turnOffGodRays();
    //     app.cutsceneBackground.stars.hideAll();
    //   }
    // }

    ////////////////////////////////////
    // santa croce stuff
    /////////////////////////////////////
    // if (outgoingTourPoint.extra === "mapChurchBells" && !newTourPoint.extra) {
    //   // turn off god rays and fade in env cube
    //   if (!isMobile) {
    //     app.post.turnOffGodRays();
    //   }

    //   const newNode = nodes.find(np => np.uuid === newTourPoint.nodeUUID);
    //   const outgoingNode = nodes.find(np => np.uuid === outgoingTourPoint.nodeUUID);
    //   app.envCube.show(newNode, outgoingNode);

    //   if (app.earthTiles) {
    //     app.earthTiles.destroy();
    //   }

    //   app.rig.skybox.removeSkyboxBackground();
    //   app.rig.skybox.turnOffFog();

    //   if (!isMobile) {
    //     app.birds.destroy();
    //   }

    //   const attribution = document.getElementById("maps-attribution");
    //   attribution.classList.add("hidden");
    //   // app.envCube.fadeOut(() => {
    //   //   console.log("showing");
    //   //   app.envCube.show();
    //   //   console.log("fading in");
    //   //   app.envCube.fadeIn();
    //   //   app.earthTiles.destroy();
    //   // });


    // } else if (newTourPoint.extra === "mapChurchBells" && !outgoingTourPoint.extra) {
    //   // turn on god rays and fade out env cube
    //   if (!isMobile) {
    //     app.post.turnOnGodRays();
    //   }

    //   app.envCube.hide();
    //   app.earthTiles = new EarthTiles();
    //   app.rig.skybox.initSkyboxBackground();

    //   if (!isMobile) {
    //     app.birds = new Birds();
    //   }
      
    //   const attribution = document.getElementById("maps-attribution");
    //   attribution.classList.remove("hidden");
    // }
  }
}