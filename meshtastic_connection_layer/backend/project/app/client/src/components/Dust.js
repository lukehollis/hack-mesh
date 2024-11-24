import * as THREE from 'three';

import Store from '../Store';

import fragment from "../shaders/fragment_dust.glsl";
import vertex from "../shaders/vertex_dust.glsl";

// const dustColor = new THREE.Color("#afad94");
// const dustColor = new THREE.Color("#e8dad8");
const dustColor = new THREE.Color("#87806C");
// const dustColor = new THREE.Color("#222222");


export default class Dust {
  constructor() {
    const { scene } = Store.getState();
    this.spotLight = null;

    const geometry = new THREE.BufferGeometry();
    const particleCount = 200;

    const positions = new Float32Array(particleCount * 3); // 3 coordinates per point

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = Math.random() * 200 - 100;
      positions[i + 1] = Math.random() * 200 - 100;
      positions[i + 2] = Math.random() * 200 - 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));


    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: dustColor },
        time: { value: 0.0 }, // Add the time uniform here
        lightPosition: { value: new THREE.Vector3() },
        lightColor: { value: new THREE.Color("#ffffff") },
        lightIntensity: { value: 0.0 },
        lightTarget: { value: new THREE.Vector3() },
        lightAngle: { value: 0.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment, 
      transparent: true,
      depthWrite: false, 
      depthTest: false, 
    });

    const particles = new THREE.Points(geometry, material);
    particles.renderOrder = 999;
    scene.add(particles);

    this.material = material;
    this.particles = particles;
  }

  handleChangeColor(newColor) {
    this.material.uniforms.color.value = new THREE.Color(newColor);
  }

  enable() {
    this.particles.visible = true;
  }

  disable() {
    this.particles.visible = false;
  }

  update() {
    const { app } = Store.getState();
    // if (!this.spotLight && app) {
    //   this.spotLight = app.rig.flashlight.light;
    // }

    if (this.material) {
      this.material.uniforms.time.value += 0.002;
    }

    // handle flashlight updates
    if (this.spotLight) {
      this.material.uniforms.lightPosition.value = this.spotLight.position;
      this.material.uniforms.lightColor.value = this.spotLight.color;
      this.material.uniforms.lightIntensity.value = this.spotLight.intensity;
      this.material.uniforms.lightTarget.value = this.spotLight.target.position;
      this.material.uniforms.lightAngle.value = this.spotLight.angle;
    } else {

    }
  }
}
