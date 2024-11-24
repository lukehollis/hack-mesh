import * as THREE from 'three';

// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

import Store from '../Store';

import fragBirdPosition from "../shaders/fragBirdPosition.glsl";
import fragBirdVelocity from "../shaders/fragBirdVelocity.glsl";
import vertBirdVS from "../shaders/vertBirdVS.glsl";
import fragBirdGeo from "../shaders/fragBirdGeo.glsl";



/* TEXTURE WIDTH FOR SIMULATION */
const WIDTH = 32;
// const BIRDS = WIDTH * WIDTH;
const BIRDS = 3;
const BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;


// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
class BirdGeometry extends THREE.BufferGeometry {

	constructor() {

		super();

		const trianglesPerBird = 3;
		const triangles = BIRDS * trianglesPerBird;
		const points = triangles * 3;

		const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
		const birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
		const references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
		const birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );

		this.setAttribute( 'position', vertices );
		this.setAttribute( 'birdColor', birdColors );
		this.setAttribute( 'reference', references );
		this.setAttribute( 'birdVertex', birdVertex );

		// this.setAttribute( 'normal', new Float32Array( points * 3 ), 3 );

		let v = 0;

		function verts_push() {

			for ( let i = 0; i < arguments.length; i ++ ) {

				vertices.array[ v ++ ] = arguments[ i ];

			}

		}

		const wingsSpan = 20;

		for ( let f = 0; f < BIRDS; f ++ ) {

			// Body

			verts_push(
				0, - 0, - 20,
				0, 4, - 20,
				0, 0, 30
			);

			// Wings

			verts_push(
				0, 0, - 15,
				- wingsSpan, 0, 0,
				0, 0, 15
			);

			verts_push(
				0, 0, 15,
				wingsSpan, 0, 0,
				0, 0, - 15
			);

		}

		for ( let v = 0; v < triangles * 3; v ++ ) {

			const triangleIndex = ~ ~ ( v / 3 );
			const birdIndex = ~ ~ ( triangleIndex / trianglesPerBird );
			const x = ( birdIndex % WIDTH ) / WIDTH;
			const y = ~ ~ ( birdIndex / WIDTH ) / WIDTH;

			const c = new THREE.Color(
				0x666666 +
				~ ~ ( v / 9 ) / BIRDS * 0x666666
			);

			birdColors.array[ v * 3 + 0 ] = c.r;
			birdColors.array[ v * 3 + 1 ] = c.g;
			birdColors.array[ v * 3 + 2 ] = c.b;

			references.array[ v * 2 ] = x;
			references.array[ v * 2 + 1 ] = y;

			birdVertex.array[ v ] = v % 9;

		}

		this.scale( 0.2, 0.2, 0.2 );

	}

}



export default class Birds {

  constructor(options = {}) {
    // Destructure or set defaults
    const {
      width = window.innerWidth,
      height = window.innerHeight
    } = options;

    this.width = width;
    this.height = height;

    this.mouseX = 0;
    this.mouseY = 0;

    this.windowHalfX = this.width / 2;
    this.windowHalfY = this.height / 2;
    this.BOUNDS = 800;
    this.BOUNDS_HALF = this.BOUNDS / 2;

		this.last = performance.now();
		this.gpuCompute;
		this.velocityVariable;
		this.positionVariable;
		this.positionUniforms;
		this.velocityUniforms;
		this.birdUniforms;

		this.destroyed = false;

    this.init();
  }

  init() {
    this.initComputeRenderer();

    // Initialize GUI & birds
    this.initGUI();
    this.initBirds();
  }

  initComputeRenderer() {
  	const { renderer } = Store.getState();
		this.gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

		if ( renderer.capabilities.isWebGL2 === false ) {

			this.gpuCompute.setDataType( THREE.HalfFloatType );

		}

		const dtPosition = this.gpuCompute.createTexture();
		const dtVelocity = this.gpuCompute.createTexture();
		this.fillPositionTexture( dtPosition );
		this.fillVelocityTexture( dtVelocity );

		this.velocityVariable = this.gpuCompute.addVariable( 'textureVelocity', fragBirdVelocity, dtVelocity );
		this.positionVariable = this.gpuCompute.addVariable( 'texturePosition', fragBirdPosition, dtPosition );

		this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] );
		this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] );

		this.positionUniforms = this.positionVariable.material.uniforms;
		this.velocityUniforms = this.velocityVariable.material.uniforms;

		this.positionUniforms[ 'time' ] = { value: 0.0 };
		this.positionUniforms[ 'delta' ] = { value: 0.0 };
		this.velocityUniforms[ 'time' ] = { value: 1.0 };
		this.velocityUniforms[ 'delta' ] = { value: 0.0 };
		this.velocityUniforms[ 'testing' ] = { value: 1.0 };
		this.velocityUniforms[ 'separationDistance' ] = { value: 1.0 };
		this.velocityUniforms[ 'alignmentDistance' ] = { value: 1.0 };
		this.velocityUniforms[ 'cohesionDistance' ] = { value: 1.0 };
		this.velocityUniforms[ 'freedomFactor' ] = { value: 1.0 };
		this.velocityUniforms[ 'predator' ] = { value: new THREE.Vector3() };
		this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );

		this.velocityVariable.wrapS = THREE.RepeatWrapping;
		this.velocityVariable.wrapT = THREE.RepeatWrapping;
		this.positionVariable.wrapS = THREE.RepeatWrapping;
		this.positionVariable.wrapT = THREE.RepeatWrapping;

		const error = this.gpuCompute.init();

		if ( error !== null ) {

			console.error( error );

		}

  }

  initBirds() {
  	const { scene } = Store.getState();
		const geometry = new BirdGeometry();

		// For Vertex and Fragment
		this.birdUniforms = {
			'color': { value: new THREE.Color( 0xff2200 ) },
			'texturePosition': { value: null },
			'textureVelocity': { value: null },
			'time': { value: 1.0 },
			'delta': { value: 0.0 }
		};

		// THREE.ShaderMaterial
		const material = new THREE.ShaderMaterial( {
			uniforms: this.birdUniforms,
			vertexShader: vertBirdVS, 
			fragmentShader: fragBirdGeo, 
			side: THREE.DoubleSide

		} );

		const birdMesh = new THREE.Mesh( geometry, material );
		birdMesh.rotation.y = Math.PI / 2;
		birdMesh.matrixAutoUpdate = false;
		birdMesh.updateMatrix();

		this.birdMesh = birdMesh;
		scene.add( birdMesh );

  }

  fillPositionTexture(texture) {
		const theArray = texture.image.data;

		for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

			const x = Math.random() * BOUNDS - BOUNDS_HALF;
			const y = Math.random() * BOUNDS - BOUNDS_HALF;
			const z = Math.random() * BOUNDS - BOUNDS_HALF;

			theArray[ k + 0 ] = x;
			theArray[ k + 1 ] = y;
			theArray[ k + 2 ] = z;
			theArray[ k + 3 ] = 1;

		}
  }

  fillVelocityTexture(texture) {
		const theArray = texture.image.data;

		for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

			const x = Math.random() - 0.5;
			const y = Math.random() - 0.5;
			const z = Math.random() - 0.5;

			theArray[ k + 0 ] = x * 10;
			theArray[ k + 1 ] = y * 10;
			theArray[ k + 2 ] = z * 10;
			theArray[ k + 3 ] = 1;

		}
  }

  onPointerMove(event) {
    if (event.isPrimary === false) return;

    this.mouseX = event.clientX - this.windowHalfX;
    this.mouseY = event.clientY - this.windowHalfY;
  }

  initGUI() {
		// const gui = new GUI();

		const effectController = {
			separation: 35.0,
			alignment: 10.0,
			cohesion: 5.0,
			freedom: 0.75
		};

		const valuesChanger = () => {

			this.velocityUniforms[ 'separationDistance' ].value = effectController.separation;
			this.velocityUniforms[ 'alignmentDistance' ].value = effectController.alignment;
			this.velocityUniforms[ 'cohesionDistance' ].value = effectController.cohesion;
			this.velocityUniforms[ 'freedomFactor' ].value = effectController.freedom;

		};

		valuesChanger();
		// gui.add( effectController, 'separation', 0.0, 100.0, 1.0 ).onChange( valuesChanger );
		// gui.add( effectController, 'alignment', 0.0, 100, 0.001 ).onChange( valuesChanger );
		// gui.add( effectController, 'cohesion', 0.0, 100, 0.025 ).onChange( valuesChanger );
		// gui.close();
  }

  update() {
  	if (this.destroyed) return;

		const now = performance.now();
		let delta = ( now - this.last ) / 1000;

		if ( delta > 1 ) delta = 1; // safety cap on large deltas
		this.last = now;

		this.positionUniforms[ 'time' ].value = now;
		this.positionUniforms[ 'delta' ].value = delta;
		this.velocityUniforms[ 'time' ].value = now;
		this.velocityUniforms[ 'delta' ].value = delta;
		this.birdUniforms[ 'time' ].value = now;
		this.birdUniforms[ 'delta' ].value = delta;

		// this.velocityUniforms[ 'predator' ].value.set( 0.5 * 	this.mouseX / this.windowHalfX, - 0.5 * this.mouseY / this.windowHalfY, 0 );

	  const { camera } = Store.getState();
		this.velocityUniforms[ 'predator' ].value.set(camera.position.x, camera.position.y, camera.position.z);

		this.mouseX = 10000;
		this.mouseY = 10000;

		this.gpuCompute.compute();

		this.birdUniforms[ 'texturePosition' ].value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
		this.birdUniforms[ 'textureVelocity' ].value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
  }

  destroy() {
	  const { scene } = Store.getState();

    // cleanup any resources or listeners
    this.destroyed = true;
    scene.remove(this.birdMesh);
  }
}
