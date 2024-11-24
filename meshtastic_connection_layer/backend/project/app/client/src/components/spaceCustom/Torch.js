import * as THREE from 'three';

import * as Photons from '../../lib/photons.module.js';
import Store from '../../Store';

export default class Torch {

    constructor(position) {
        const { scene, camera, renderer } = Store.getState();
        this.position = position;
        this.particleSystems = [];
        this.manager = new Photons.Manager();
        this.jsonTypeStore = new Photons.JSONTypeStore();
        this.jsonTypeStore.addNamespace('THREE', THREE);
        this.jsonTypeStore.addNamespace('Photons', Photons);
        this.instancedParticleSystems = true;


        this.setupSceneComponents();
        this.setupParticleSystems();
    }

    setupParticleSystems() {
        let scale = 0.25;
        let flamePosition = this.position;
        this.manager.addParticleSystem(this.setupEmbers(scale, flamePosition));
        // this.manager.addParticleSystem(this.setupBaseFlame(scale, flamePosition));
        // this.manager.addParticleSystem(this.setupBrightFLame(scale, flamePosition));
    }

    setupEmbers(scale, position) {
        const { scene, camera, renderer } = Store.getState();

        const embersRoot = new THREE.Object3D();
        embersRoot.position.copy(position);

        const texturePath = 'https://static.mused.org/textures/ember.png';
        const embersTexture = new THREE.TextureLoader().load(texturePath);
        const embersAtlas = new Photons.Atlas(embersTexture, texturePath);
        embersAtlas.addFrameSet(1, 0.0, 0.0, 1.0, 1.0);
        const embersRenderer = new Photons.AnimatedSpriteRenderer(this.instancedParticleSystems, embersAtlas, true, THREE.AdditiveBlending);

        const embersParticleSystem = new Photons.ParticleSystem(embersRoot, embersRenderer, renderer);
        embersParticleSystem.init(150);

        embersParticleSystem.setEmitter(new Photons.ConstantParticleEmitter(6));

        const sizeInitializerGenerator = new Photons.RandomGenerator(THREE.Vector2,
            new THREE.Vector2(0.0, 0.0),
            new THREE.Vector2(scale * 0.15, scale * 0.15),
            0.0, 0.0, false);
        embersParticleSystem.addParticleStateInitializer(new Photons.LifetimeInitializer(3.0, 1.0, 0.0, 0.0, false));
        embersParticleSystem.addParticleStateInitializer(new Photons.SizeInitializer(sizeInitializerGenerator));
        embersParticleSystem.addParticleStateInitializer(new Photons.BoxPositionInitializer(
            new THREE.Vector3(0.05 * scale, 0.0, 0.05 * scale),
            new THREE.Vector3(-0.025 * scale, 0.0, -0.025 * scale)));
        embersParticleSystem.addParticleStateInitializer(new Photons.RandomVelocityInitializer(
            new THREE.Vector3(0.4 * scale, 0.5 * scale, 0.4 * scale),
            new THREE.Vector3(-0.2 * scale, 0.8 * scale, -0.2 * scale),
            0.6 * scale, 0.8 * scale, false));

        const embersOpacityOperator = embersParticleSystem.addParticleStateOperator(new Photons.OpacityInterpolatorOperator());
        embersOpacityOperator.addElements([
            [0.0, 0.0],
            [0.7, 0.25],
            [0.9, 0.75],
            [0.0, 1.0]
        ]);

        const embersColorOperator = embersParticleSystem.addParticleStateOperator(new Photons.ColorInterpolatorOperator(true));
        embersColorOperator.addElementsFromParameters([
            [[1.0, 0.7, 0.0], 0.0],
            [[1.0, 0.6, 0.0], 0.5],
            [[1.0, 0.4, 0.0], 1.0]
        ]);

        const acceleratorOperatorGenerator = new Photons.SphereRandomGenerator(Math.PI * 2.0, 0.0, Math.PI,
            -Math.PI / 2, 20.0, -8,
            scale, scale, scale,
            0.0, 0.0, 0.0);

        embersParticleSystem.addParticleStateOperator(new Photons.AccelerationOperator(acceleratorOperatorGenerator));

        embersParticleSystem.setSimulateInWorldSpace(true);
        embersParticleSystem.start();

        return embersParticleSystem;
    }

    setupBaseFlame(scale, position) {
        const baseFlameRoot = new THREE.Object3D();
        baseFlameRoot.position.copy(position);

        const texturePath = 'https://static.mused.org/textures/base_flame.png';
        const baseFlameTexture = new THREE.TextureLoader().load(texturePath);
        const baseFlameAtlas = new Photons.Atlas(baseFlameTexture, texturePath);
        baseFlameAtlas.addFrameSet(18, 0.0, 0.0, 128.0 / 1024.0, 128.0 / 512.0);
        const baseFlameRenderer = new Photons.AnimatedSpriteRenderer(this.instancedParticleSystems, baseFlameAtlas, true);

        const baseFlameParticleSystem = new Photons.ParticleSystem(baseFlameRoot, baseFlameRenderer, renderer);
        baseFlameParticleSystem.init(50);

        baseFlameParticleSystem.setEmitter(new Photons.ConstantParticleEmitter(10));

        baseFlameParticleSystem.addParticleSequence(0, 18);
        const baseFlameParticleSequences = baseFlameParticleSystem.getParticleSequences();

        baseFlameParticleSystem.addParticleStateInitializer(new Photons.LifetimeInitializer(0.0, 0.0, 0.0, 0.0, false));
        baseFlameParticleSystem.addParticleStateInitializer(new Photons.RotationInitializer(new Photons.RandomGenerator(0, Math.PI / 2.0, -Math.PI / 2.0, 0.0, 0.0, false)));
        baseFlameParticleSystem.addParticleStateInitializer(new Photons.RotationalSpeedInitializer(1.0, -1.0, 0.0, 0.0, false));
        baseFlameParticleSystem.addParticleStateInitializer(new Photons.SizeInitializer(
            new Photons.RandomGenerator(THREE.Vector2,
                new THREE.Vector2(0.25 * scale, 0.25 * scale),
                new THREE.Vector2(0.5 * scale, 0.5 * scale),
                0.0, 0.0, false)));

        baseFlameParticleSystem.addParticleStateInitializer(new Photons.BoxPositionInitializer(
            new THREE.Vector3(0.05 * scale, 0.0, 0.05 * scale),
            new THREE.Vector3(-0.025 * scale, 0.0, -0.025 * scale)));
        baseFlameParticleSystem.addParticleStateInitializer(new Photons.RandomVelocityInitializer(
            new THREE.Vector3(0.05 * scale, 0.4 * scale, 0.05 * scale),
            new THREE.Vector3(-0.025 * scale, 0.8 * scale, -0.025 * scale),
            0.35 * scale, 0.5 * scale, false));
        baseFlameParticleSystem.addParticleStateInitializer(new Photons.SequenceInitializer(baseFlameParticleSequences));

        baseFlameParticleSystem.addParticleStateOperator(new Photons.SequenceOperator(baseFlameParticleSequences, 0.07, false));

        const baseFlameOpacityOperator = baseFlameParticleSystem.addParticleStateOperator(new Photons.OpacityInterpolatorOperator());
        baseFlameOpacityOperator.addElements([
            [0.0, 0.0],
            [0.3, 0.25],
            [0.3, 0.5],
            [0.0, 1.0]
        ]);

        const baseFlameSizeOperator = baseFlameParticleSystem.addParticleStateOperator(new Photons.SizeInterpolatorOperator(true));
        baseFlameSizeOperator.addElementsFromParameters([
            [[0.6, 0.6], 0.0],
            [[1.0, 1.0], 0.4],
            [[1.0, 1.0], 1.0]
        ]);

        const baseFlameColorOperator = baseFlameParticleSystem.addParticleStateOperator(new Photons.ColorInterpolatorOperator(true));
        baseFlameColorOperator.addElementsFromParameters([
            [[1.0, 1.0, 1.0], 0.0],
            [[1.5, 1.5, 1.5], 0.5],
            [[1.0, 1.0, 1.0], 1.0]
        ]);

        baseFlameParticleSystem.addParticleStateOperator(new Photons.AccelerationOperator(
            new Photons.RandomGenerator(THREE.Vector3, new THREE.Vector3(0.0, 0.0, 0.0),
                new THREE.Vector3(0.0, 1.5 * scale, 0.0),
                0.0, 0.0, false)));

        baseFlameParticleSystem.setSimulateInWorldSpace(true);
        baseFlameParticleSystem.start();

        return baseFlameParticleSystem;
    }

    setupBrightFLame(scale, position) {
        const brightFlameRoot = new THREE.Object3D();
        brightFlameRoot.position.copy(position);

        const texturePath = 'https://static.mused.org/textures/bright_flame.png';
        const brightFlameTexture = new THREE.TextureLoader().load(texturePath);
        const brightFlameAtlas = new Photons.Atlas(brightFlameTexture, texturePath);
        brightFlameAtlas.addFrameSet(16, 0.0, 0.0, 212.0 / 1024.0, 256.0 / 1024.0);
        const brightFlameRenderer = new Photons.AnimatedSpriteRenderer(this.instancedParticleSystems, brightFlameAtlas, true);

        const brightFlameParticleSystem = new Photons.ParticleSystem(brightFlameRoot, brightFlameRenderer, renderer);
        brightFlameParticleSystem.init(20);

        brightFlameParticleSystem.setEmitter(new Photons.ConstantParticleEmitter(5));

        brightFlameParticleSystem.addParticleSequence(0, 16);
        const brightFlameParticleSequences = brightFlameParticleSystem.getParticleSequences();

        brightFlameParticleSystem.addParticleStateInitializer(new Photons.LifetimeInitializer(0.0, 0.0, 0.0, 0.0, false));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.RotationInitializer(new Photons.RandomGenerator(0, Math.PI, -Math.PI / 2.0, 0.0, 0.0, false)));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.RotationalSpeedInitializer(Math.PI / 2.0, -Math.PI / 4.0, 0.0, 0.0, false));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.SizeInitializer(
            new Photons.RandomGenerator(THREE.Vector2,
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(0.0, 0.0),
                0.2 * scale, 0.65 * scale, false)));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.BoxPositionInitializer(
            new THREE.Vector3(0.1 * scale, 0.0, 0.1 * scale),
            new THREE.Vector3(-0.05 * scale, 0.0, -0.05 * scale)));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.RandomVelocityInitializer(
            new THREE.Vector3(0.02 * scale, 0.4 * scale, 0.02 * scale),
            new THREE.Vector3(-0.01 * scale, 0.4 * scale, -0.01 * scale),
            0.1 * scale, .2 * scale, false));
        brightFlameParticleSystem.addParticleStateInitializer(new Photons.SequenceInitializer(brightFlameParticleSequences));

        brightFlameParticleSystem.addParticleStateOperator(new Photons.SequenceOperator(brightFlameParticleSequences, 0.1, false));

        const brightFlameOpacityOperator = brightFlameParticleSystem.addParticleStateOperator(new Photons.OpacityInterpolatorOperator());
        brightFlameOpacityOperator.addElements([
            [0.0, 0.0],
            [0.6, 0.2],
            [0.5, 0.75],
            [0.0, 1.0]
        ]);

        const brightFlameSizeOperator = brightFlameParticleSystem.addParticleStateOperator(new Photons.SizeInterpolatorOperator(true));
        brightFlameSizeOperator.addElementsFromParameters([
            [[0.3, 0.3], 0.0],
            [[1.0, 1.0], 0.4],
            [[1.0, 1.0], 0.55],
            [[0.65, 0.65], 0.75],
            [[0.1, 0.1], 1.0]
        ]);

        const brightFlameColorOperator = brightFlameParticleSystem.addParticleStateOperator(new Photons.ColorInterpolatorOperator(true));
        brightFlameColorOperator.addElementsFromParameters([
            [[1.0, 1.0, 1.0], 0.0],
            [[2.0, 2.0, 2.0], 0.3],
            [[2.0, 2.0, 2.0], 0.4],
            [[0.9, 0.6, 0.3], 0.65],
            [[0.75, 0.0, 0.0], 1.0]
        ]);

        brightFlameParticleSystem.addParticleStateOperator(new Photons.AccelerationOperator(
            new Photons.RandomGenerator(THREE.Vector3,
                new THREE.Vector3(0.0, 0.0, 0.0),
                new THREE.Vector3(0.0, 1.5 * scale, 0.0),
                0.0, 0.0, false)));

        brightFlameParticleSystem.setSimulateInWorldSpace(true);

        brightFlameParticleSystem.start();
        return brightFlameParticleSystem;
    }

    setupSceneComponents() {
        const { scene, camera, renderer } = Store.getState();
        const lightParent = new THREE.Object3D();

        scene.add(lightParent);
        lightParent.position.copy(this.position);
        lightParent.position.add(new THREE.Vector3(0, 0.65, 0));

        const flickerLightShadows = {
            'mapSize': 128,
            'cameraNear': 0.001,
            'cameraFar': 100,
            'bias': -0.0001,
            'edgeRadius': 3
        };
        this.manager.addComponent(
        	new Photons.FlickerLight(
        		lightParent, 0.2, 0.01, 
        		new THREE.Color(0xf5d26b), 
        		0, 1.0, flickerLightShadows)
        	);            
    }

    update() {
    	this.manager.update();
    }

    render() {
        const { scene, camera, renderer } = Store.getState();
        this.manager.render(renderer, camera);
    }

}
