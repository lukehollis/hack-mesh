import * as THREE from 'three';


import Store from './Store';
import { areVector3Equal } from './lib/util';


const calculatePinchDistance = (touch1, touch2) => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

const debounce = (func, wait) => {
  let timeout;

  return function executedFunction(...args) {
    const context = this; // Capturing the context here
    const later = () => {
      clearTimeout(timeout);
      func.apply(context, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default class PointerHandlers {
  constructor() {
    this.fadeTimeout = null;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.startPinchDistance = null;

    // Assuming the 'up' vector of your cursor is the positive Y-axis. Adjust if necessary.
    this.cursorUp = new THREE.Vector3(0, 1, 0); 

    // Rotate around Z-axis by 90 degrees
    this.cursorRotationEuler = new THREE.Euler(Math.PI / 2, 0, 0); // Euler angles in radians
    this.cursorAdditionalQuaternion = new THREE.Quaternion().setFromEuler(this.cursorRotationEuler);

    // Bind the debounced function directly
    this.handleMouseMove = debounce(this.handleMouseMove.bind(this), 1);
  }


  handleMouseMove(event) {
    event.preventDefault();
    this.processInteractionMove(event.clientX, event.clientY, event.target);
  }

  handleTouchMove(event) {
    event.preventDefault();
    const { app, viewMode } = Store.getState();

    if (event.touches.length > 0) {
      if (viewMode === "FPV" && event.touches.length === 2) {
        const newPinchDistance = calculatePinchDistance(event.touches[0], event.touches[1]);

        if (this.startPinchDistance === null) {
          this.startPinchDistance = newPinchDistance;
        }

        const zoomSpeed = 0.3;  // Adjust speed as needed
        const direction = newPinchDistance > this.startPinchDistance ? 1 : -1;
        const zoomAmount = (newPinchDistance - this.startPinchDistance) * zoomSpeed;


        app.cameraHandlers.handleZoom(zoomAmount);

        this.startPinchDistance = newPinchDistance;

      } else {

        const touch = event.touches[0];
        this.processInteractionMove(touch.clientX, touch.clientY, event.target);

        Store.setState({
          cursor: {
            position: new THREE.Vector3(), 
            rotation: new THREE.Quaternion(), 
          },
        });

      }
    }
  }

  processInteractionMove(clientX, clientY, eventTarget) {
    const store = Store.getState();
    const { app, camera, scene, floorMarkers, annotations } = store;

    const rect = eventTarget.getBoundingClientRect();
    
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    let intersects = [];
    if (app.dollhouse.gltf && app.dollhouse.gltf.scene) {
      intersects = this.raycaster.intersectObjects(app.dollhouse.gltf.scene.children, true);
    }

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].face) {
        const targetNormal = intersects[i].face.normal;
        const quaternion = new THREE.Quaternion().setFromUnitVectors(this.cursorUp, targetNormal);
        quaternion.multiply(this.cursorAdditionalQuaternion); // Apply the additional rotation

        Store.setState({
          cursor: {
            position: intersects[i].point,
            rotation: quaternion, 
          },
        });
        break;
      }
    }

    let newHoveredFloorMarker = null;
    let floorMarkerIntersects = [];
    if (floorMarkers) {
      floorMarkerIntersects = this.raycaster.intersectObjects(floorMarkers, true);
    }

    for (let i = 0; i < floorMarkerIntersects.length; i++) {
      if (floorMarkerIntersects[i].object && floorMarkerIntersects[i].object.floorMarker) {
        newHoveredFloorMarker = floorMarkerIntersects[i].object.floorMarker; 
      }
    }
    
    if (newHoveredFloorMarker !== this.previousHoveredFloorMarker) {
      // Trigger onMouseLeave for the previously hovered floor marker
      if (this.previousHoveredFloorMarker) {
        this.previousHoveredFloorMarker.onMouseLeave();
      }

      // Update the previous hovered marker
      this.previousHoveredFloorMarker = newHoveredFloorMarker;

      // Trigger onMouseEnter for the new hovered floor marker
      if (newHoveredFloorMarker) {
        newHoveredFloorMarker.onMouseEnter();
      }
    }

    // code for raycasting annotations
    let newHoveredAnnotation = null;
    let annotationIntersects = [];
    if (annotations) {
      annotationIntersects = this.raycaster.intersectObjects(annotations, true);
    }

    for (let i = 0; i < annotationIntersects.length; i++) {
      if (annotationIntersects[i].object && annotationIntersects[i].object.annotation) {
        newHoveredAnnotation = annotationIntersects[i].object.annotation;
        break; // Assuming you only care about the first intersected annotation
      }
    }

    if (newHoveredAnnotation !== this.previousHoveredAnnotation) {
      // Trigger onMouseLeave for the previously hovered annotation
      if (this.previousHoveredAnnotation) {
        this.previousHoveredAnnotation.onMouseLeave();
      }

      // Update the previous hovered annotation
      this.previousHoveredAnnotation = newHoveredAnnotation;

      // Trigger onMouseEnter for the new hovered annotation
      if (newHoveredAnnotation) {
        newHoveredAnnotation.onMouseEnter();
      }
    }


    // use this when you need cursor ring 
    this.handleCursorFade();
  }

  handleCursorFade() {
    const activeOpacity = 0.3; 

    // on movement, update the cursor opacity
    Store.setState({ cursorOpacity: activeOpacity });
    // clear the existing fade timeout
    clearTimeout(this.fadeTimeout);

    // set a new fade timeout with updated time to fade the cursor on non-movement
    this.fadeTimeout = setTimeout(()  => {
      let progress = 0;
      let duration = 200;

      const interval = setInterval(() => {
        progress += 20;
        const factor = progress / duration;
        Store.setState({ cursorOpacity: activeOpacity-factor });
        if (progress >= duration) {
          clearInterval(interval);
          Store.setState({ cursorOpacity: 0.001 });
        }
      }, 20);
    }, 2000);
  }

  handleMouseClick(event) {
    this.processInteractionClick(event.clientX, event.clientY, event);
  }

  handleTouchTap(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.processInteractionClick(touch.clientX, touch.clientY, event);
    }
  }

  processInteractionClick(clientX, clientY, event) {
    const { app, camera, scene, currentNode, viewMode, debugMode, tourGuidedMode } = Store.getState();

    // Check if the click is on an HTML button or other UI elements you want to exclude
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'path'  || event.target.classList.contains('button-icon')) {
      return;
    }
    
    event.preventDefault();

    // if needed, prevent navigation out of orbit mode in guided tour mode 
    // if (tourGuidedMode && viewMode === "ORBIT") return;

    // Calculate mouse position in normalized device coordinates
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the new mouse position
    this.raycaster.setFromCamera(this.mouse, camera);

    // first check if the user clicked on a specific nav point
    // Array to store all intersected objects
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    let nearestNode;
    let nearestDollhouseIntersect;
    let nearestDollhouseDistance = Infinity;
    let smallestAngle = Infinity;
    let nearestDistance = Infinity;
    let isNodeClick = false;
    let isFloormarkerClick = false;
    let isDollhouseClick = false;


    for (let intersect of intersects) {
      if (intersect.object.isDollhouse) {
        isDollhouseClick = true;

        const distanceToCamera = intersect.point.distanceTo(camera.position);
        if (distanceToCamera < nearestDollhouseDistance) {
          nearestDollhouseDistance = distanceToCamera;
          nearestDollhouseIntersect = intersect;
        }

      }
    }

    // Loop through all intersected objects and find the mesh you're interested in
    for (let intersect of intersects) {
      // omit the transform controls
      if (intersect.object.isTransformControlsPlace) { return }

      if (intersect.object.floorMarker) {
        isFloormarkerClick = true;

        const distanceToCamera = intersect.point.distanceTo(camera.position);
        // Ignore node if it's further away than the nearest dollhouse intersection
        if (distanceToCamera < nearestDollhouseDistance) { 

          // don't try to navigate to point you're currently at
          if (intersect.object.floorMarker.uuid !== currentNode.uuid || viewMode === "ORBIT") {
            
            // Get the group holding the floorMarker
            const floormarkerGroup = intersect.object.parent;

            // Get the parent Node of the floormarker group
            const parentNode = app.nodes.nodes.find(node => node.uuid === floormarkerGroup.node.uuid);

            // navigate to the newly clicked nav point
            app.ensureFacesLoadedThenNavigate(parentNode);
            return;
          }
        }
      }

      if (!isFloormarkerClick && debugMode && intersect.object.node) {

        const distanceToCamera = intersect.point.distanceTo(camera.position);
        // Ignore node if it's further away than the nearest dollhouse intersection
        if (distanceToCamera < nearestDollhouseDistance) { 
          // don't try to navigate to point you're currently at
          if (viewMode === "ORBIT" || intersect.object.node.uuid !== currentNode.uuid) {
            isNodeClick = true;
            // navigate to the newly clicked nav point

            app.ensureFacesLoadedThenNavigate(intersect.object.node);
            return;
          }
        }
      }
    }

    if (!isDollhouseClick && !isFloormarkerClick && !isNodeClick) {
      // Get the click vector
      const clickDirection = this.raycaster.ray.direction.clone().normalize();

      // Iterate over the nodes in the app.nodes.nodes list
      for (const node of app.nodes.nodes) {
        if (viewMode === "FPV" && node.uuid === currentNode.uuid) continue;

        // Use getWorldPosition to get the node's position in world space
        const nodeWorldPosition = new THREE.Vector3();
        node.group.getWorldPosition(nodeWorldPosition);

        const directionToNode = nodeWorldPosition.clone().sub(camera.position).normalize();

        const angle = clickDirection.angleTo(directionToNode);
        const distance = camera.position.distanceTo(nodeWorldPosition);

        if (angle < Math.PI / 8 && angle < smallestAngle && distance < nearestDistance) {
          nearestNode = node;
          smallestAngle = angle;
          nearestDistance = distance;
        }
      }
    }

    if (isDollhouseClick && nearestDollhouseIntersect) {
      // Iterate over all nodes
      for (const node of app.nodes.nodes) {
        // Get the node's position in world coordinates
        const nodeWorldPosition = new THREE.Vector3();
        node.group.getWorldPosition(nodeWorldPosition);

        // Calculate the distance from the intersection point to the node
        const distance = nearestDollhouseIntersect.point.distanceTo(nodeWorldPosition);

        // If this node is closer than the current nearest node, or if there is no current nearest node
        if (nearestNode === undefined || distance < nearestDistance) {
          // Update the nearest node and the nearest distance
          nearestNode = node;
          nearestDistance = distance;
        }
      }
    }


    if (nearestNode) {
      app.ensureFacesLoadedThenNavigate(nearestNode);
    }

  }
}

