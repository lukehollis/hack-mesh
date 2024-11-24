import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import Store from '../../Store';
import Model from '../Model';

const sceneData = {
  type: 'group',
  id: 'root',
  children: []
};

const temple_models = [];

sceneData.children = temple_models;


export default class DelphiTemple {

  constructor() {
    const { scene } = Store.getState();

    this.modelLookup = {}; // This will store models by their id


    // build the scene
    this.buildSceneGraph(sceneData);
  }

  buildSceneGraph(node) {
    const { scene } = Store.getState();

    if (node.type === 'group') {
      const group = new THREE.Group();
      group.position.set(...(node.position || [0, 0, 0]));
      node.children.forEach(childNode => this.buildSceneGraph(childNode, group));
      scene.add(group);

      this.modelLookup[node.id] = group; // Store the group by its id

    } else if (node.type === 'model') {
      const model = new Model(node);
      this.modelLookup[node.id] = model; // Store the model by its id
    }
  }

  addHelpers() {
    const { scene } = Store.getState();
    
    const size = 10; // Size of the grid (you can adjust this based on your scene scale)
    const divisions = 10; // How many divisions in the grid
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    const length = 5; // Length of the axes (you can adjust this based on your scene scale)
    const axesHelper = new THREE.AxesHelper(length);
    scene.add(axesHelper);
  }

  getModelById(id) {
    const model = this.modelLookup[id];
    return model;
  }

  showModelById(id) {
    const model = this.modelLookup[id];
    if (model) {
      model.show();
    } else {
      console.warn(`Model with id ${id} not found.`);
    }
  }

  hideModelById(id) {
    const model = this.modelLookup[id];
    if (model) {
      model.hide();
    } else {
      console.warn(`Model with id ${id} not found.`);
    }
  }

  // Hide all models
  hideAllModels() {
    Object.keys(this.modelLookup).forEach(id => {
      const model = this.modelLookup[id];
      if (model && typeof model.hide === 'function') {
        model.hide();
      }
    });
  }

  // Hide all models
  showAllModels() {
    Object.keys(this.modelLookup).forEach(id => {
      const model = this.modelLookup[id];
      if (model && typeof model.show === 'function') {
        model.show();
      }
    });
  }

  // space custom must have an update
  update() {}
}
