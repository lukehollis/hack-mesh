import * as THREE from 'three'
import Space from './Space';

import {
    calculateCameraPosition,
    makeTextureTemplateUrls,
    getInitialCameraPosition,
    getInitialOrbitTarget
} from './lib/util';


// parse the data from the HTML first as a Space
const space = new Space();

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// settings for customization during local development
const DEBUG_MODE = false;
const SET_FLOORMARKER_HEIGHTS = DEBUG_MODE;
const VIEW_MODE = "FPV";
let initialNode = space.data.nodes.find(node => node.uuid === space.data.initialNode);

// Canvas
const canvas = document.querySelector('canvas.webgl');

// camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.02, 10000);

// Set the initial camera position to the initial navigation point's position
let initialOrbitTarget = getInitialOrbitTarget(space.data);
let initialCameraPosition = getInitialCameraPosition(space.data);
let initialFov = 90;
let initialZoom = 20;

// tour guided mode
const tourGuidedMode = (
        space.data.tour_data 
    && 'spaces' in space.data.tour_data
    && space.data.tour_data.spaces.length > 0
);

// if is guided tour mode, set the initial node to the first tour point
if (tourGuidedMode) {
    initialNode = space.data.nodes.find(node => node.uuid === space.data.tour_data.spaces[0].tourpoints[0].nodeUUID);

    initialOrbitTarget = getInitialOrbitTarget(
            space.data, 
            initialNode,
        );
    initialCameraPosition = getInitialCameraPosition(
            space.data, 
            initialNode, 
            space.data.tour_data.spaces[0].tourpoints[0].rotation
        );

    initialZoom = space.data.tour_data.spaces[0].tourpoints[0].zoom;
    initialFov = 110 - space.data.tour_data.spaces[0].tourpoints[0].zoom;
}



camera.position.copy(initialCameraPosition);
camera.fov = initialFov;
camera.updateProjectionMatrix();

// scene
const scene = new THREE.Scene();



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: "high-performance",
  // stencil: false,
})
renderer.gammaFactor = 2.2;
// renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Using 2 as the max value for DPR
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setSize(sizes.width, sizes.height);


// time
const clock = new THREE.Clock();


const initialStore = {
    space,
    app: null,
    camera,
    scene,
    canvas,
    sizes,
    renderer,
    clock,
    viewMode: VIEW_MODE,
    styleMode: "",
    cursor: { position: new THREE.Vector3(), rotation: new THREE.Quaternion() },
    cursorOpacity: 0,
    cameraPosition: initialCameraPosition,
    lastMouseMove: Date.now(),
    zoomLvl: initialZoom,
    fullScreenMode: false,
    debugMode: DEBUG_MODE,
    setFloormarkerHeights: SET_FLOORMARKER_HEIGHTS,
    appLoaded: false,
    sceneInited: false,
    fov: initialFov,
    currentNode: initialNode,
    outgoingNode: initialNode,
    isNavigating: false,
    savedRotation: null,
    lerping: false,
    lerpValue: 0,
    minimapCamera: null,
    minimapRenderer: null,
    orbitControlsTarget: initialOrbitTarget,
    sceneGraph: null,
    textures: {},
    materialCache: {},
    tourGuidedMode,
    tourSpaceActiveIdx: 0,
    tourPointActiveIdx: 0,
    tourLightMode: false,
    floorMarkers: [],
    annotations: [],
    loadingManager: new THREE.LoadingManager(),
    isMobile,
};


// Store.js
class Store {
    constructor() {
        this.store = initialStore;
        this.listeners = [];
    }

    getState() {
        return this.store;
    }

    setState(newStore) {
        this.store = { ...this.store, ...newStore };
        this.notifyAll();
    }

    listen(listener) {
        this.listeners.push(listener);
    }

    notifyAll() {
        this.listeners.forEach(listener => listener(this.store));
    }
}

const store = new Store();

export default store;