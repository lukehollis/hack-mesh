import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { GeoUtils, WGS84_ELLIPSOID, GoogleTilesRenderer } from '3d-tiles-renderer';

import Store from '../Store';


class EarthTiles {
    constructor() {
        this.tiles = null;

        this.apiKey = "AIzaSyCjrvXOn9ps2An0WLhrobkIbAOPFfg5i0Y";

        this.init();
   }

    init() {
        const { scene, camera, renderer } = Store.getState();

        if ( this.tiles ) {

            scene.remove( this.tiles.group );
            this.tiles.dispose();
            this.tiles = null;

        }

        this.tiles = new GoogleTilesRenderer( this.apiKey );

        // tiles.setLatLonToYUp( 35.3606 * THREE.MathUtils.DEG2RAD, 138.7274 * THREE.MathUtils.DEG2RAD ); // Mt Fuji
        // tiles.setLatLonToYUp( 48.8584 * THREE.MathUtils.DEG2RAD, 2.2945 * THREE.MathUtils.DEG2RAD ); // Eiffel Tower
        // this.tiles.setLatLonToYUp( 41.8902 * THREE.MathUtils.DEG2RAD, 12.4922 * THREE.MathUtils.DEG2RAD ); // Colosseum
        // tiles.setLatLonToYUp( 43.8803 * THREE.MathUtils.DEG2RAD, - 103.4538 * THREE.MathUtils.DEG2RAD ); // Mt Rushmore
        // tiles.setLatLonToYUp( 36.2679 * THREE.MathUtils.DEG2RAD, - 112.3535 * THREE.MathUtils.DEG2RAD ); // Grand Canyon
        // tiles.setLatLonToYUp( - 22.951890 * THREE.MathUtils.DEG2RAD, - 43.210439 * THREE.MathUtils.DEG2RAD ); // Christ the Redeemer

        // this.tiles.setLatLonToYUp( 9.1528927 * THREE.MathUtils.DEG2RAD, 43.7685683 * THREE.MathUtils.DEG2RAD );
        this.tiles.setLatLonToYUp( 43.768612160312586 * THREE.MathUtils.DEG2RAD, 11.261943416073466 * THREE.MathUtils.DEG2RAD ); // Santa Croce
        // this.tiles.setLatLonToYUp( 29.979451 * THREE.MathUtils.DEG2RAD, 31.138886 * THREE.MathUtils.DEG2RAD ); // Giza
        

        // Note the DRACO compression files need to be supplied via an explicit source.
        // We use unpkg here but in practice should be provided by the application.
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( 'https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/' );

        const loader = new GLTFLoader( this.tiles.manager );
        loader.setDRACOLoader( dracoLoader );

        this.tiles.manager.addHandler( /\.gltf$/, loader );

        // cast shadows 
    this.tiles.group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        // Change material to MeshPhongMaterial
        obj.material = new THREE.MeshPhongMaterial({
            // Copy relevant properties from the original material
            color: obj.material.color,
            map: obj.material.map, // assuming the original material has a texture map
            // ... any other properties you need to copy
        });
      }
    });


        scene.add( this.tiles.group );
        this.tiles.group.position.y -= 100;

        this.tiles.setResolutionFromRenderer( camera, renderer );
        this.tiles.setCamera( camera );
    }


    update() {
        if (!this.tiles) return;

        const { camera, renderer } = Store.getState();

        this.tiles.setResolutionFromRenderer(camera, renderer);
        this.tiles.setCamera(camera);
        this.tiles.update();
    }

    destroy() {
        if ( this.tiles ) {
            const { scene, camera, renderer } = Store.getState();

            scene.remove( this.tiles.group );
            this.tiles.dispose();
            this.tiles = null;

        }
    }
}

export default EarthTiles;
