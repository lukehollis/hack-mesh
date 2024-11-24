import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

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

import { GodraysPass } from 'three-good-godrays';

import Store from '../../Store';


/** 
 * Post
 */

export default class ArtOfIntimidationGodraysPass {

    constructor() {

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        }

        this.setupPasses();
    }

    setupPasses() {
        const { scene, app, camera, composer, renderer } = Store.getState();

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = true;
        renderer.shadowMap.needsUpdate = true;

        const lightColor = 0xf5d26b;
        const dirLight = new THREE.DirectionalLight(lightColor, 0.2);
        const godraysSettings = {
            density: 0.001,
            maxDensity: 0.5,
            distanceAttenuation: 2,
            color: lightColor,
            edgeStrength: 2,
            edgeRadius: 2,
            raymarchSteps: 20,
            enableBlur: false,
            blurVariance: 0.1,
            blurKernelSize: 1,
        };
        this.godraysSettings = godraysSettings;

        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 20;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        dirLight.shadow.camera.updateProjectionMatrix();
        dirLight.shadow.autoUpdate = true;
        dirLight.position.set(20, 4, 0);
        dirLight.target.position.set(-10, 0, 0);
        dirLight.target.updateMatrixWorld();
        this.dirLight = dirLight;
        scene.add(dirLight);

        // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight);
        // dirLightHelper.lightPlane.material.color.set(0x444444); // Dark gray plane
        // dirLightHelper.targetLine.material.color.set(0x000000); // Black line
        // scene.add(dirLightHelper);


        const godraysPass = new GodraysPass(dirLight, camera, godraysSettings);
        godraysPass.renderToScreen = false;

        const smaaEffect = new SMAAEffect();
        const smaaPass = new EffectPass(camera, smaaEffect);
        smaaPass.renderToScreen = true;

        this.godraysPass = godraysPass;
        this.smaaPass = smaaPass;

    }

    initGUI() {
        const gui = new GUI();

        gui.add(this.godraysSettings, 'density', 0, 0.1).step(0.0001).name('Density').onChange(this.updateGodRaysEffect.bind(this));
        gui.add(this.godraysSettings, 'maxDensity', 0, 1).step(0.05).name('Max Density').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'distanceAttenuation', 0, 2).step(0.1).name('Distance Attenuation').onChange(this.updateGodRaysEffect);
        gui.addColor(this.godraysSettings, 'color').name('Color').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'edgeStrength', 0, 10).step(0.1).name('Edge Strength').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'edgeRadius', 0, 5).step(0.1).name('Edge Radius').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'raymarchSteps', 1, 100).step(1).name('Raymarch Steps').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'enableBlur').name('Enable Blur').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'blurVariance', 0, 0.5).step(0.01).name('Blur Variance').onChange(this.updateGodRaysEffect);
        gui.add(this.godraysSettings, 'blurKernelSize', 1, 5).step(1).name('Blur Kernel Size').onChange(this.updateGodRaysEffect);

        gui.close();
    }

    updateGodRaysEffect() {
        if (!this.godraysPass) return; // Ensure the god rays effect has been initialized
        console.log("updating godrays pass");

        this.dirLight.color = new THREE.Color(this.godraysSettings.color);
        this.godraysPass.setParams({
            ...this.godraysSettings,
            color: new THREE.Color(this.godraysSettings.color),
            blur: this.godraysSettings.enableBlur
                ? { variance: this.godraysSettings.blurVariance, kernelSize: this.godraysSettings.blurKernelSize }
                : false,
        });
    }

    turnOnGodRays() {
        const { app } = Store.getState();
        const composer = app.post.composer;

        if (composer.passes.includes(this.smaaPass)) {
            composer.removePass(this.smaaPass);
        }

        console.log("Turning on Godrays");
        composer.addPass(this.godraysPass);
        composer.addPass(this.smaaPass);

        app.post.renderPass.renderToScreen = false;
    }

    turnOffGodRays() {
        const { app } = Store.getState();
        const composer = app.post.composer;
        if (composer.passes.includes(this.godraysPass)) {
            composer.removePass(this.godraysPass);
        }
    }

}

