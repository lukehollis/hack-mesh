import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import Store from '../Store';



export default class DebugInfo {
  constructor() {
    this.container = document.getElementById('debug-container'); // The DOM element where you want to append the debug info
    this.stats = new Stats();
    this.debugMode = false; // Default value
    this.currentNode = null;
  }

  setNode(node) {
    this.currentNode = node;
  }

  handleToggleDebugMode() {
    const store = Store.getState();
    const { debugMode } = store;

    if (debugMode) {
      this.showDebugInfo();
    } else {
      this.hideDebugInfo();
    }
  }
    
  showDebugInfo() {
    const { currentNode } = Store.getState();

    // Append the FPS counter
    this.container.appendChild(this.stats.dom);

    // Style and show the currentNode info
    if (currentNode) {
      const debugText = document.createElement('span');
      debugText.class = 'fixed top-2 right-2 block text-white text-xs text-right rounded-lg p-2 hover:bg-black/10';
      debugText.innerHTML = `
        ${currentNode.uuid}:
        <br>
        ${currentNode.position.x.toFixed(3)}, ${currentNode.position.y.toFixed(3)}, ${currentNode.position.z.toFixed(3)}
        <br>
        ${currentNode.rotation.x.toFixed(3)}, ${currentNode.rotation.y.toFixed(3)}, ${currentNode.rotation.z.toFixed(3)}
      `;
      this.container.appendChild(debugText);
    }
  }

  hideDebugInfo() {
    // Remove the FPS counter and the debug text
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  update() {
    const store = Store.getState();
    const { debugMode } = store;
    if (debugMode) {
      this.stats.update();
    }
  }
}

