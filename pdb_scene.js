import * as THREE from 'three';

import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

var scene = new THREE.Scene();

// Create a camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a root object to hold the loaded object
var root = new THREE.Object3D();
scene.add(root);

// Create an instance of OBJLoader
var loader = new THREE.OBJLoader();

// Load the object
loader.load(
    // URL of the OBJ file
    'scene.obj',

    // onLoad callback function
    function (object) {
        // Add the loaded object to the root object
        root.add(object);

        // Render the scene
        render();
    },

    // onProgress callback function (optional)
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    // onError callback function (optional)
    function (error) {
        console.log('An error happened: ' + error);
    }
);

// Function to render the scene
function render() {
    renderer.render(scene, camera);
}