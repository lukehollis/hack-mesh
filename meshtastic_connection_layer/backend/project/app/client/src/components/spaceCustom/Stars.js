import * as THREE from 'three';
import Store from '../../Store';

export default class Stars {
  constructor() {
    const { scene, camera } = Store.getState();
    const numStars = 150;
    const starSize = 4;

    // Load the star textures
    const textureLoader = new THREE.TextureLoader();
    const textures = [
      textureLoader.load('https://static.mused.org/nefertari_star_1.png'),
      textureLoader.load('https://static.mused.org/nefertari_star_2.png'),
      textureLoader.load('https://static.mused.org/nefertari_star_3.png'),
    ];

    // Create material and geometry
    const geometry = new THREE.PlaneGeometry(starSize, starSize);

    // Store star positions to check for overlap
    const starPositions = [];

    // Create a group to hold the stars
    const starGroup = new THREE.Group();

    this.fadeInProgress = Array(numStars).fill(0);
    this.fadeInDuration = 600; // per star
    this.totalDuration = 6000; // for all stars
    this.materials = [];

    // Create stars
    for (let i = 0; i < numStars; i++) {
      // Choose texture cyclically
      const texture = textures[i % textures.length];
      // Create custom shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          imagetexture: { value: texture },
          starAlpha: { value: 0.0 },
          targetColor: { value: new THREE.Color(0x576987) },
          mixAmount: { value: 0.8 }, // control the mix amount
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D imagetexture;
          uniform vec3 targetColor;
          uniform float mixAmount;
          uniform float starAlpha;
          varying vec2 vUv;

          void main() {
            vec4 color = texture2D(imagetexture, vUv);
            color.rgb = mix(color.rgb, targetColor, mixAmount); // Mix with the target color
            gl_FragColor = vec4(color.rgb, color.a * starAlpha);
          }
        `,
      });
      this.materials.push(material);

      const star = new THREE.Mesh(geometry, material);

      // Position the star inside the sphere of radius 50
      const radius = 100;
      let position;
      do {
        const theta = 2 * Math.PI * Math.random();
        // const phi = Math.acos(2 * Math.random() - 1);
        // const phi = Math.PI / 4 + Math.PI / 4 * Math.random();
        const phi = Math.PI / 2 * Math.random();
        position = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
      } while (starPositions.some(vec => vec.distanceTo(position) < starSize * 2)); // Re-position if too close to another star

      starPositions.push(position);
      star.position.copy(position);

      // Face the star towards the camera
      star.lookAt(camera.position);
      star.rotation.z = 0;
      star.renderOrder = 9;

      // Add the star to the group
      starGroup.add(star);
    }

    // Rotate the group 90 degrees around the x-axis
    starGroup.rotation.x = (Math.PI / -2);

    // Add the group to the scene
    scene.add(starGroup);
  }

  fadeInStar(index) {
    const material = this.materials[index];
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += 20;
      const alpha = progress / this.fadeInDuration;
      material.uniforms.starAlpha = { value: alpha };

      if (progress >= this.fadeInDuration) {
        clearInterval(interval);
      }
    }, 20);
  }

  startFadeIn() {
    const intervalBetweenStars = this.totalDuration / this.materials.length;
    this.materials.forEach((_, index) => {
      setTimeout(() => {
        this.fadeInStar(index);
      }, index * intervalBetweenStars);
    });
  }

  fadeOutStar(index) {
    const material = this.materials[index];
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;
      const alpha = 1 - (progress / this.fadeInDuration);
      material.uniforms.starAlpha.value = alpha;

      if (progress >= this.fadeInDuration) {
        clearInterval(interval);
      }
    }, 20);
  }

  startFadeOut() {
    const intervalBetweenStars = this.totalDuration / this.materials.length;
    this.materials.forEach((_, index) => {
      setTimeout(() => {
        this.fadeOutStar(index);
      }, index * intervalBetweenStars);
    });
  }

  showAll() {
    this.materials.forEach((_, index) => {
      const material = this.materials[index];
      material.uniforms.starAlpha = { value: 1 };
    });
  }

  hideAll() {
    this.materials.forEach((_, index) => {
      const material = this.materials[index];
      material.uniforms.starAlpha = { value: 0 };
    });
  }
}
