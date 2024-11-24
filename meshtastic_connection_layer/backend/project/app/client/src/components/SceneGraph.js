import * as THREE from 'three';

import Model from './Model'; 
import Store from '../Store';


const sceneData = {
  type: 'group',
  id: 'root',
  children: []
};

const rami_models = [{
    id: "paramessu-statue",
    type: 'model',
    file: 'https://static.mused.org/nespekashuty.glb',
    fileType: 'glb',
    position: [0, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [1, 1, 1],
    isSketch: true,
  }, {
    id: "horemheb-colossos",
    type: 'model',
    file: 'https://static.mused.org/horemheb_colossos.glb',
    fileType: 'glb',
    position: [-7.65, 8, 7],
    rotation: [0.01, 0, 0.01],
    scale: [3.5, 3.5, 3.5],
    isSketch: false,
  }, {
    id: "horemheb-reconstruction",
    type: 'model',
    file: 'https://static.mused.org/horemheb_reconstruction4.glb',
    fileType: 'glb',
    position: [-6, 11, 7.4],
    rotation: [0, 0, 0],
    scale: [1.2, 1, 1],
    isSketch: true,
  }];


  // information for paramessu statue
  // "secondaryText": "Statue of Paramessu (Ramesses I) as a Scribe. New Kingdom, 19th Dynasty, ca. 1292-1290 B.C.E. Egyptian Museum, Cairo. JE 44863.",


  // type: 'group',
  // children: [{
  //   id: "terrain",
  //   type: 'model',
  //   file: 'https://static.mused.org/spaceshare/vok_terrain.glb',
  //   fileType: 'glb',
  //   position: [150, -220, 150],
  //   rotation: [0, 90, 0],
  //   scale: [100, 100, 100],
  //   showOnStep: 99,
  // }]



export default class SceneGraph {
  constructor() {
    const { scene } = Store.getState();

    this.modelLookup = {}; // This will store models by their id
    this.buildSceneGraph(sceneData);
    // this.addHelpers();
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
      const model = new Model(node, this.light);
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
}

