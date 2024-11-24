import * as THREE from 'three'

import {
  EffectComposer,
  RenderPass,
  SelectiveBloomEffect,
  OutlineEffect,
  BlendFunction,
  SMAAEffect,
  KernelSize,
  Pass,
  EffectPass,
  ShaderPass,
} from 'postprocessing';

import Store from '../Store';


/** 
 * Post
 */

export default class Postprocessing {

  constructor() {
    const { camera, renderer } = Store.getState();

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.setupPasses();
  }

  setupPasses() {
    const { scene, camera, renderer, isMobile } = Store.getState();

    this.renderPass = new RenderPass(scene, camera);


    const composer = new EffectComposer(renderer);
    composer.addPass(this.renderPass);
    this.composer = composer;

  }
}

