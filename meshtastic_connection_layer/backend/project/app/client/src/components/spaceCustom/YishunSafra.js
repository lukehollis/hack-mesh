import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import Store from '../../Store';



export default class YishunSafra {
    constructor() {
        this.clock = new THREE.Clock(); // Needed to update the mixer
    }

    onLoad() {

	    this.loader = new GLTFLoader();


	    const dracoLoader = new DRACOLoader();
	    dracoLoader.setDecoderPath('https://static.mused.org/spaceshare/draco1.5.6/');

	    // Attach DracoLoader instance to GLTFLoader
	    this.loader.setDRACOLoader(dracoLoader);

	    this.mesh = null;
	    this.renderOrder = 11;

	    this.loader.load("https://static.mused.org/velociraptor.glb", this.handleLoad.bind(this));
	}

	handleLoad(gltf) {
		const { scene, app } = Store.getState();

		this.mesh = gltf.scene;

		this.mesh.position.set(-13, 0.3, -16.5);
		this.mesh.rotation.set(0, 1.14, 0);
		gltf.scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				// child.material.depthTest = false;
				// child.material.depthWrite = false;
				// child.side = THREE.DoubleSide;
				child.renderOrder = this.renderOrder;
		        child.castShadow = true;
		        child.receiveShadow = true; 
			}
		});

		scene.add(this.mesh);

	    // Add a yellow-white point light
	    const spotLight = new THREE.SpotLight(0xffffbb, 10); // Color, intensity
	    spotLight.position.set(-10, 8, -10); // Position the light above and in front of the model
	    spotLight.angle = Math.PI / 2; // Adjust the light cone angle
	    spotLight.penumbra = 0.5; // Soften the edge of the light cone
	    spotLight.decay = 0.4;
	    spotLight.distance = 50; // How far the light shines
	    spotLight.target = this.mesh; // Set the light to shine towards the dinosaur model
	    scene.add(spotLight);

        // // Optional: add a helper to visualize the spot light's position and direction
	    // const helper = new THREE.SpotLightHelper(spotLight);
	    // scene.add(helper);


		if (gltf.animations && gltf.animations.length) {
			const object = gltf.scene || gltf.scenes[0];
            this.mixer = new THREE.AnimationMixer(object);
            const clips = gltf.animations;
		    const idleClip = gltf.animations.find(clip => clip.name === "Idle_01"); // Replace "Idle" with the correct name
		    if (idleClip) {
		        const action = this.mixer.clipAction(idleClip);
		        action.reset().play();
		    }
        }

        app.dollhouse.hideOccluders();
        app.envCube.setDepthPropertiesForMaterials(true);
    }

	handleChangeTourPoint() {}

    update(){
    	        // You need to update the mixer on each frame
        if (this.mixer) {
            const delta = this.clock.getDelta(); // Get the time elapsed since the last frame
            this.mixer.update(delta); // Update the animation mixer
        }
    }

    render(){}
}