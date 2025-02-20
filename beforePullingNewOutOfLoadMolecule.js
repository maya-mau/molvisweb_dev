
//import three js and all the addons that are used in this script 
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PDBLoader } from './mymods/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//import { TW } from '/TWPackage.js';
//import { TW } from 'tw';



// GLOBAL CONSTANTS
const CPK = 'Ball-and-stick';
const VDW = 'Space filling';
const lines = 'Lines';

// icosahedron 
const detail = 3;

console.log("start script")


// initialize the baseline objects  
let camera, scene, renderer, labelRenderer, container;
let controls;
let root;
let geometryAtoms, geometryBonds, json_atoms, json_bonds, json_bonds_manual, json_bonds_conect, residues, chains;
// let outlinePass, composer;
var raycaster, mouse = {x: 0, y: 0 }

const cameraOption = 'orthographic';

let initialPosition, initialTarget, initialQuaternion;

const PDBloader = new PDBLoader(); 
const offset = new THREE.Vector3();

// setting default/on load molecule  

const defaultParams = {
    mculeParams: { molecule: 'caffeine.pdb' },
    repParams: { representation: CPK },
    colorParams: { color: 'Name' },
    residueParams: { residue: 'all' },
    chainParams: { chain: 'all' },
    atomParams: { atom: 'all' },
    withinParams: { within: 0 },
    withinDropdownParams: { withinDropdown: 'molecule' },
    withinResParams: { withinRes: "" }
}

var selectedObject = null;

var distanceMeasurementAtoms = [];
var mainColor = null; 
const atomContent = document.getElementsByClassName('atom-content')[0];

var currentMolecule = 'caffeine';
var currentStyle = defaultParams.repParams.representation;
var currentSelectionMethod = 'residue';
var currentSelectionValue = defaultParams.residueParams.residue;

var numRepTabs = 1;
var currentRep = 0;
var currentGUI = null;
var prevRep = null;

globalThis.numRepTabs = numRepTabs;
globalThis.currentRep = currentRep;

const maxRepTabs = 4;

let guis = [];
let tabs = [];
let guiContainers = [];
let repStates = Array(maxRepTabs).fill(false);

let frames = 0, prevTime = performance.now();
const framesOn = true;

const backboneAtoms = ['c', 'ca', 'n', 'o'];

// set key controls, TODO find a place to move it
var isDistanceMeasurementMode = false

// amount of molecule selected, may change
var residueSelected = defaultParams.residueParams.residue; // default all
var chainSelected = defaultParams.chainParams.chain;
 
//specific settings for the raycaster (clicker) that make it senstitive enough to distinguish atoms 
raycaster = new THREE.Raycaster();
raycaster.near = .1;
raycaster.far = Infinity;
raycaster.params.Points.threshold = 0.1; 
raycaster.params.Line.threshold = 0.1;  

// names to display + associated filename of pdb files 
const MOLECULES = {
    'Ponatinib': 'ponatinib_Sep2022.pdb',
    'Caffeine': 'caffeine.pdb',
    'Abl kinase': 'Ablkinase.pdb',
    'Ponatinib abl kinase': 'ponatinib_Ablkinase_Jun2022.pdb'
};



// call everything! 
init();

animate();

// init function - sets up scene, camera, renderer, controls, and GUIs 
function init() {

    // initialize main window 
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    globalThis.scene = scene;
    
    container = document.getElementsByClassName('column middle')[0]; // could try fixing the squish TODO
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    
    
    if (cameraOption == 'orthographic') {
            
        // TODO need to edit these to be dynamic based on the molecule maybe
        let w = containerWidth;
        let h = containerHeight;
        let viewSize = h;
        let aspectRatio = w / h;
    
        let left = (-aspectRatio * viewSize) / 2;
        let right = (aspectRatio * viewSize) / 2;
        let top = viewSize / 2;
        let bottom = -viewSize / 2;
        let near = -10000;
        let far = 10000; 
    
        camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        camera.position.z = 1000;
            
    } else {
        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
        camera.position.z = 1000;
    }

    globalThis.camera = camera;
    scene.add( camera );

    // object needs to be illuminated to be visible // TODO, could work on this, lighting is kind of strange
    var ambientLight = new THREE.AmbientLight ( 0xffffff, 1);
    scene.add( ambientLight );

    const light1 = new THREE.DirectionalLight( 0xffffff, 2.5 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light2.position.set(  1, - 1, -1 );
    scene.add( light2 );

    // root contains all the objects of the scene 
    root = new THREE.Group();
    scene.add( root );
    root.visible = true;

    // renderer makes scene visible 
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);

    // place the scene in the column middle window 
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

    // allow user to move around the molecule 
    if (cameraOption == 'orthographic') {
        controls = new OrbitControls( camera, renderer.domElement );
        controls.autoRotate = true;
        /* controls.minZoom = 0;
        controls.maxZoom = 3000; */
    } else {
        controls = new TrackballControls( camera, renderer.domElement ); // TODO, controls zooming out boundaries
        controls.minDistance = 100;
        controls.maxDistance = 3000;
    }

    initialPosition = camera.position.clone();
    initialQuaternion = camera.quaternion.clone();
    initialTarget = controls.target.clone();

    // the default/first molecule to show up 
    loadMolecule( defaultParams.mculeParams.molecule, CPK, currentRep );

    // dynamic screen size 
    window.addEventListener( 'resize', onWindowResize );



    // add event listener to add rep button
    const addRep = document.getElementById('add-rep');
    addRep.addEventListener('click', onAddRepClick);

    // add event listener to delete rep button
    const deleteRep = document.getElementById('delete-rep');
    deleteRep.addEventListener('click', onDeleteRepClick);


    // add molecule selection GUI to div with class=molecule-gui
    const molGUIContainer = document.getElementById('mol-gui');
    const moleculeGUI = new GUI({ autoPlace: false }); 
    const molMenu = moleculeGUI.add(defaultParams.mculeParams, 'molecule', MOLECULES);
    molGUIContainer.appendChild(molMenu.domElement); 

    molMenu.onChange(function(molecule) {
        //popup();
        console.log("trying to load", molecule, defaultParams.repParams.representation);
        residueSelected = 'all';

        currentMolecule = molecule;

        console.log('currentMolecule now: ', currentMolecule);

        resetScene();
        loadMolecule(molecule, defaultParams.repParams.representation, currentRep);
        resetMoleculeOrientation();
        
        resetEverything();
        //popdown();
    });

    createGUIs();    

    //TW.addSceneBoundingBoxHelper(scene);

    onWindowResize();
}


function resetEverything () {
    resetGUIs();
    hideAllReps();
        

    tabs.forEach( (tab) => { tab.style.display = 'none'; })

    for (let i = 0; i < maxRepTabs; i++) {
        resetTab(i);
        repStates[i] = false;
    }

    currentRep = 0;
    numRepTabs = 1;
    showCurrentRep(currentRep);

    Array.from(document.getElementsByClassName('bond-length')).forEach( (elem) => elem.remove() );
    Array.from(document.getElementsByClassName('error-para')).forEach( (elem) => elem.remove() );

    distanceMeasurementAtoms = [];
}

function storeInitialView() {
    initialPosition.copy(camera.position);
    initialQuaternion.copy(camera.quaternion);
    initialTarget.copy(controls.target);
}

function resetScene() {
    // reset the scene because something new is being loaded 
    while ( root.children.length > 0 ) {
        const object = root.children[ 0 ];
        object.parent.remove( object );
    }
}

function getVisibleBoundingBox() {
    let box = new THREE.Box3();
    let tempBox = new THREE.Box3();

    root.traverse( (obj) => {
        if (obj.isMesh && obj.visible) {

            obj.geometry.computeBoundingBox();
            tempBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
            box.union(tempBox);
        } 
    })

    let helper = new THREE.Box3Helper(box, new THREE.Color(0xff0000)); // Red color
    scene.add(helper);  // Add helper to scene for visualization
    helper.visible = false;

    return box;
}

function getBoundingBoxCenter() {

    let boundingBox = getVisibleBoundingBox();
    let center = new THREE.Vector3();
    boundingBox.getCenter(center);
    return center;
}

function recenterCamera(camera, controls) {

    let boundingBox = getVisibleBoundingBox();
    let center = getBoundingBoxCenter();
    
    let size = boundingBox.getSize(new THREE.Vector3());
    let maxDim = Math.max(size.x, size.y, size.z);

    if (camera.isPerspectiveCamera) {
        let distanceMultiplier = 2.5; // Adjust this value to zoom out more
        let distance = maxDim * distanceMultiplier;
    
        camera.position.set(
            center.x,
            center.y,
            center.z + distance
        );
    
        let aspect = window.innerWidth / window.innerHeight;
        let fov = 2 * Math.atan((maxDim / 2) / distance) * (180 / Math.PI);
        camera.fov = Math.min(Math.max(fov, 30), 75); // Clamp FOV between 30 and 75 degrees
        camera.aspect = aspect;
        camera.near = 0.1;
        camera.far = maxDim * 10;
    
        controls.minDistance = maxDim * 0.5;
        controls.maxDistance = maxDim * 10;
        controls.target.copy(center);

    } else {

        console.log('camera is orthographic');

        let scaleFactor = 1.2; // Increase this value to zoom out more
        let left = (-size.x) / 2 * scaleFactor;
        let right = (size.x) / 2 * scaleFactor;
        let top = size.y / 2 * scaleFactor;
        let bottom = -size.y / 2 * scaleFactor;
        let near = -maxDim * 5;
        let far = maxDim * 5;

        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.near = near;
        camera.far = far;

        camera.position.set(center.x, center.y, maxDim * 2);
        controls.target.copy(center);

        
        
    }

    
    camera.updateProjectionMatrix();
    controls.update();

    storeInitialView();
}

function calculateTime(startTime, endTime, message) {
    let totalTime = Math.abs(endTime - startTime);
    //console.log('time in milliseconds:', totalTime);
    console.log(message, 'in seconds:', totalTime/1000);
}


// reset all GUIs to default
function resetGUIs() {
    for (let i = 0; i < maxRepTabs; i++) {
        resetTab(i);
    }
}

// creates a new copy of atoms and bonds for every tab
// from the given pdb and given representation style, 
// then loads default molecul (rep 0, CPK) into scene 
function loadMolecule(model, representation, rep) { 
    let startTime = new Date();

    console.log('in new new version that creates a new copy and atoms/bonds for every tab')
    console.log("loading model", model, "representation", representation);

    // grab model file 
    const url = './models/molecules/' + model;

    // load by the pdb file 
    PDBloader.load( url, function ( pdb ) {
        // properties of pdb loader that isolate the atoms & bonds
        let manual = true; // TO DO - use manual for now, implement options for manual OR conect later

        if (manual) { 
            geometryBonds = pdb.geometryBondsManual; 
        } else { 
            geometryBonds = pdb.geometryBondsConect;
        }

        //console.log("pdb.geometryBondsManual", pdb.geometryBondsManual.attributes.position.array);

        geometryAtoms = pdb.geometryAtoms;

        json_atoms = pdb.json_atoms;
        //console.log("json_atoms.atoms", json_atoms.atoms);
        json_bonds_manual = pdb.json_bonds_manual.bonds_manual;
        json_bonds_conect = pdb.json_bonds_conect.bonds_conect;

        json_bonds = json_bonds_manual;

        residues = pdb.residues;
        chains = pdb.chains;
        console.log('chains', chains);

        // define different representation geometries

        /* let boxGeometryCPK = new THREE.BoxGeometry( 1, 1, 1 );
        let sphereGeometryCPK = new THREE.IcosahedronGeometry(1, detail ); 
        
        // slightly thicker bonds for visibility, no atoms 
        /* let boxGeometryLines = new THREE.BoxGeometry( 3, 3, 1 );
        let sphereGeometryLines = new THREE.BoxGeometry(.5, .5, .5);  */

        // figure out how to get lines atoms to be half a bond and colored
        

        //let sphereGeometryVDW = new THREE.IcosahedronGeometry(); // defined later due to dependence of radius of each atom
 
        let sphereGeometry, boxGeometry;

        //let repDict = {'CPK': [boxGeometryCPK, sphereGeometryCPK], 'lines': [boxGeometryLines, sphereGeometryLines], 'VDW': [null, sphereGeometryVDW]}
        let repDict = {"Ball-and-stick": [], 'Lines': [], 'Space filling': []};
        
        let randTime = new Date();
        //starting setup to put atoms into scene 
        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate(); // the offset moves the center of the bounding box to the origin?
        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );
        //console.log("offset", offset.x, offset.y, offset.z );

        //grab atom content from pdb so their position and color go along 
        let positions = geometryAtoms.getAttribute( 'position' );

        const colors = geometryAtoms.getAttribute( 'color' );
        const position = new THREE.Vector3();
        
        root.visible = true;
        let randTimeEnd = new Date();
        calculateTime(randTime, randTimeEnd, 'stuff before atom loading');

        let atomStartTime = new Date();
        // LOAD IN ATOMS 
        for ( let i = 0; i < positions.count; i ++ ) {

            // loop through the positions array to get every atom 
            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            //console.log("json_atoms.atoms", json_atoms.atoms)            
            
            // create a set of atoms/bonds for each tab
            for (let n = 0; n < maxRepTabs; n++) {
                //console.log('loaded atoms for tab', n);
                
                // create a set of atoms/bonds in each of the 3 styles for each tab
                for (let key in repDict) {
                    //console.log('loaded atoms for style', key);

                    let color = new THREE.Color().setRGB(colors.getX( i ), colors.getY( i ), colors.getZ( i ));

                    let material = new THREE.MeshPhongMaterial();
                    material.color = color;

                    let isNaN;
                    if (key == VDW) {
                        // sphere visuals for VDW, radius depends on atom and is scaled up for viewing 
                        let rad = getRadius(json_atoms.atoms[i][4])*2

                        if (Number.isNaN(rad)) {
                            isNaN = true;
                            rad = 1;
                        }

                        sphereGeometry = new THREE.IcosahedronGeometry(rad, detail );

                    } else if (key == CPK) {
                        let sphereGeometryCPK = new THREE.IcosahedronGeometry(1, detail );
                        sphereGeometry = sphereGeometryCPK;
                    } else if (key == lines) {
                        let sphereGeometryLines = new THREE.BoxGeometry(.5, .5, .5);
                        sphereGeometry = sphereGeometryLines;
                    }
        
                    // create atom object that is a sphere with the position, color, and content we want 
                    const object = new THREE.Mesh( sphereGeometry, material );
                    object.position.copy( position );
                    object.position.multiplyScalar( 75 ); // TODOlater figure out why scaling
                    object.scale.multiplyScalar( 25 );
                    //sphereGeometry.computeBoundingSphere();
        
                    object.molecularElement = "atom";
                    object.style = key;
                    object.repNum = n;
                    object.residue = json_atoms.atoms[i][5];
                    object.chain = json_atoms.atoms[i][6];
                    object.atomName = json_atoms.atoms[i][7];
                    object.originalColor = new THREE.Color().setRGB(colors.getX( i ), colors.getY( i ), colors.getZ( i ));

                    object.material.color.set(color);
                    
                    // reference to original pdb within object for raycaster 
                    object.atomValue = i; 
        
                    // add atom object to scene 
                    root.add( object );

                    if (key == representation && n == rep) {
                        object.visible = true;
                    } else {
                        object.visible = false;
                    }

                }
            } 
        }

        let atomEndTime = new Date();
        calculateTime(atomStartTime, atomEndTime, 'time to load atoms');

        // LOAD BONDS
        let bondStartTime = new Date();
        positions = geometryBonds.getAttribute( 'position' );
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        for ( let i = 0; i < positions.count; i += 2 ) {

            let bond = json_bonds[i/2]; // loops through bonds 0 to however many bonds there are, divide by 2 because i increments by 2 
            
            let atom1 = json_atoms.atoms[bond[0]-1];
            let atom2 = json_atoms.atoms[bond[1]-1];
            //console.log(atom1, atom2)

            // get bond start & end locations 
            /* start.x = atom1[0];
            start.y = atom1[1];
            start.z = atom1[2]; */

            start.x = positions.getX( i );
            start.y = positions.getY( i );
            start.z = positions.getZ( i );
    
            /* end.x = atom2[0];
            end.y = atom2[1];
            end.z = atom2[2]; */

            end.x = positions.getX( i+1 );
            end.y = positions.getY( i+1 );
            end.z = positions.getZ( i+1 );
    
            start.multiplyScalar( 75 );
            end.multiplyScalar( 75 );

            for (let n = 0; n < maxRepTabs; n++) {
                //console.log('loaded bonds for tab', n);

                for (let key in repDict) {
                    //console.log('loaded bonds for style', key);

                    // skip bond loading if VWD
                    if (key == VDW) {
                        break;
                    } else if (key == CPK) {
                        let boxGeometryCPK = new THREE.BoxGeometry( 1, 1, 1 );
                        boxGeometry = boxGeometryCPK;
                    } else if (key == lines) {
                        let boxGeometryLines = new THREE.BoxGeometry( 3, 3, 1 );
                        boxGeometry = boxGeometryLines;
                    }

                    //object.originalColor = new THREE.Color().setRGB(colors.getX( i ), colors.getY( i ), colors.getZ( i ))
                    const bondMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
        
                    // make bond a rectangular prism & add it to scene 
                    const object = new THREE.Mesh( boxGeometry, bondMaterial );
                    object.position.copy( start );
                    object.position.lerp( end, 0.5 );
                    object.scale.set( 5, 5, start.distanceTo( end ) );


                    // figure out why bonds are still blue after switching back

                    object.molecularElement = "bond";
                    object.style = key;
                    object.repNum = n;
                    object.atom1 = atom1;
                    object.atom2 = atom2;
                    object.originalColor = 'rgb(255, 255, 255)';
                    // change everything to the string format for originalColor

                    object.lookAt( end );
                    root.add( object );
    
                    // only if key is equal to the rep we want and rep is correct, make visible, else hide
                    if (key == representation && n == rep) {
                        object.visible = true;
                    } else {
                        object.visible = false;
                    }
                }
            }
        }

        let bondEndTime = new Date();
        calculateTime(bondStartTime, bondEndTime, 'time to load bonds');

        /* geometryAtoms.computeBoundingBox();
        console.log("geometryAtoms bounding box:", geometryAtoms.boundingBox); */
    
        // render the scene after adding all the new atom & bond objects   
        
        recenterCamera(camera, controls);

        storeInitialView();

        console.log('render');         
        render();

        let endTime = new Date();
        calculateTime(startTime, endTime, 'time to loadMolecule');
        
    } );

    
}

function hideMolecule(style, repNum) {

    let startTime = new Date();

    root.traverse ( (obj) => {

        if (obj.style == style && obj.repNum == repNum) {
            obj.visible = false;

            // reset color???
            obj.material.color.set(new THREE.Color(obj.originalColor));
            
        }
    })

    let endTime = new Date();
    calculateTime(startTime, endTime, 'time to hide molecule ' + style + repNum);
}

function isString(variable) {
    return typeof variable === "string";
  }

// assume only called after loadMolecule is called on the desired molecule,
// so assume the atoms/bonds for this specific molecule already exist in the scene.
// all selection values should be valid by the time they reach this function
function showMolecule(style, repNum, selectionMethod, selectionValue, colorValue) {
    console.log('in showMolecule');

    currentStyle = style;
    currentRep = repNum;
    currentSelectionMethod = selectionMethod;
    //console.log('selectionValue:', selectionValue, typeof selectionValue);

    if (typeof selectionValue == 'string') { selectionValue = selectionValue.split(' ') }
    currentSelectionValue = selectionValue;
    //currentColorValue = colorValue;

    console.log(currentStyle, currentRep, currentSelectionMethod, currentSelectionValue, colorValue);

    // target array for distance calculations
    let target = [];
    let validResidues = {};

    if (selectionMethod == 'distance') {

        const distance = Number(selectionValue[0]);
        const type = selectionValue[1];
        let selected = selectionValue[2];

        if (isString(selected)) {
            if (selected.toLowerCase() == 'drug') {
                selected = 'D';
            } else if (selected.toLowerCase() == 'abl kinase') {
                selected = 'A';
            }
        }

        
        // find all target molecule atoms
        if (type == 'residue') {

            root.traverse( (obj) => {
                if (obj.isMesh && obj.repNum == currentRep && obj.style == currentStyle && obj.residue == selected) {
                    target.push([obj.position.x, obj.position.y, obj.position.z]);
                }
            })

        } else if (type == 'molecule') {
            //console.log('2 are we entering here?');

            root.traverse( (obj) => {
                //console.log('3 are we entering here?');
                //console.log('obj', obj);
                if (obj.isMesh && obj.repNum == currentRep && obj.style == currentStyle && obj.chain == selected) {
                    //console.log('found something!');
                    target.push([obj.position.x, obj.position.y, obj.position.z]);
                }
            })
        }
        
        //console.log(target);

        // find all residues within the required distance to the target atoms
        root.traverse( (obj) => {
            for (let coord of target) {

                let dist = calculateDistanceXYZ(coord, [obj.position.x, obj.position.y, obj.position.z]);

                if (dist <= distance) {
                    validResidues[obj.residue] = true;
                } 
            }
        })

    }


    //root.visible = true;
    root.traverse( (obj) => {

        if (obj.isMesh && obj.style == style && obj.repNum == repNum) {
            //console.log('match', obj.style, style, obj.repNum, repNum)
            if (selectionValue == 'all') {
                setColor(obj, colorValue);
                obj.visible = true;
            } else {
                if (obj.molecularElement == 'atom') {
                    if (selectionMethod == 'atom') {
    
                    } else if (selectionMethod == 'residue') {
    
                        //console.log('showMolecule, selecting by residue in atom');

                        if (obj.residue == selectionValue) {
                            setColor(obj, colorValue);
                            obj.visible = true;
                        } else {
                            obj.visible = false;  // might try to do this in hide molecule? see if it works here
                        }
    
                    } else if (selectionMethod == 'chain') {  
                        //console.log('showMolecule, selecting by chain in atom');
                        if (selectionValue == 'backbone') {
                            //console.log("obj.atomName", obj.atomName);

                            if (backboneAtoms.includes(obj.atomName)) { 
                                //console.log("obj.atomName", obj.atomName);
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }

                        } else {
                            if (obj.chain == selectionValue) {
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }
                        }
                        
                    } else if (selectionMethod == 'distance') { 
                        
                        const type = selectionValue[1];
                        let selected = selectionValue[2];

                        if (isString(selected)) {
                            if (selected.toLowerCase() == 'drug') {
                                selected = 'D';
                            } else if (selected.toLowerCase() == 'abl kinase') {
                                selected = 'A';
                            }
                        }

                        //console.log('in selectionMethod distancce of showMolecule', type);


                        if (type == 'residue') {

                            // check if residue is within distance and if obj isn't part of the original target
                            if (validResidues[obj.residue] && obj.residue != selected) {
                                //console.log('residue', obj.residue);
                                //console.log('atom', obj.position.x, obj.position.y, obj.position.z);
                                setColor(obj, colorValue);
                                //console.log('set color of', obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }

                        } else if (type == 'molecule') {

                            if (validResidues[obj.residue] && obj.chain != selected) {
                                //console.log('obj', obj);
                                setColor(obj, colorValue);
                                //console.log('set color of', obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }
                        }
                    }

                } else if (obj.molecularElement == 'bond') {
                    //console.log('object is bond');
                    //console.log(obj);
                    if (selectionMethod == 'atom') {
    
                    } else if (selectionMethod == 'residue') {
    
                        //console.log('selecting by residue in bond');
                        let atom1 = obj.atom1;
                        let atom2 = obj.atom2;
    
                        /* console.log('atom1.residue', atom1.residue);
                        console.log('atom2.residue', atom2.residue);
                        console.log('selection', selection); */
    
                        if (atom1[5] == selectionValue && atom2[5] == selectionValue) {
                            setColor(obj, colorValue);
                            obj.visible = true;
                        } else {
                            obj.visible = false; 
                        }
    
                    } else if (selectionMethod == 'chain') {

                        let atom1 = obj.atom1;
                        let atom2 = obj.atom2;

                        if (selectionValue == 'backbone') {
                            if (backboneAtoms.includes(atom1[7]) && backboneAtoms.includes(atom2[7])) { 
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }
                        } else {
        
                            if (atom1[6] == selectionValue && atom2[6] == selectionValue) {
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false; 
                            }
                        }
                        
                        
                    } else if (selectionMethod == 'distance') {
            
                        const type = selectionValue[1];
                        let selected = selectionValue[2];

                        if (isString(selected)) {
                            if (selected.toLowerCase() == 'drug') {
                                selected = 'D';
                            } else if (selected.toLowerCase() == 'abl kinase') {
                                selected = 'A';
                            }
                        }
                        

                        let atom1 = obj.atom1;
                        let atom2 = obj.atom2;
                        //console.log(obj);
                        //console.log(atom1);

                        if (type == 'residue') {

                            // check if residue is within distance and if obj isn't part of the original target
                            if (validResidues[atom1[5]] && validResidues[atom2[5]] && atom1[5] != selected && atom2[5] != selected) {
                                //console.log('residue', obj.residue);
                                //console.log('atom', obj.position.x, obj.position.y, obj.position.z);
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }

                        } else if (type == 'molecule') {

                            if (validResidues[atom1[5]] && validResidues[atom2[5]] && atom1[6] != selected && atom2[6] != selected) {
                                //console.log('residue', obj.residue);
                                //console.log('atom', obj.position.x, obj.position.y, obj.position.z);
                                setColor(obj, colorValue);
                                obj.visible = true;
                            } else {
                                obj.visible = false;
                            }

                        }
                    }
                }
            }
        }
    
    
    
    })

}


function colorChange(repNum, style, colorValue) {
    root.traverse ( (obj) => {

        if (obj.isMesh && obj.visible && obj.repNum == repNum && obj.style == style) {
            setColor(obj, colorValue);
        }
    })
}

function setColor(obj, colorValue) {

    //console.log('setting color of', obj, colorValue);
    if (colorValue == 'Blue') {                        
        obj.material.color.set(new THREE.Color('rgb(0, 0, 255)')); 
    } else if (colorValue == 'Green') {
        obj.material.color.set(new THREE.Color('rgb(0, 255, 0)')); 
    } else if (colorValue == 'Red') {
        obj.material.color.set(new THREE.Color('rgb(255, 0, 0)')); 
    } else if (colorValue == 'Name') {
        /* if (obj.molecularElement == 'bond') {
            console.log("obj", obj);
            console.log("obj.originalColor", obj.originalColor);
        } */
        
        obj.material.color.set(new THREE.Color(obj.originalColor));
    }
}


// returns the rep number from a given id (e.g. getNumFromId('rep-tab-2') returns 2)
function getNumFromId(id) {
    let splitId = id.split('-');
    let len = splitId.length;
    return Number(splitId[len - 1]);
}


// helper functions for adding reps

// hides all rep contents and removes class='active' from all rep tabs
function hideAllReps() { 
    console.log('in hideAllReps');

    // Get the container element
    const guiContainer = document.getElementsByClassName('three-gui')[0];

    // get all elements with class="tab-content-rep" and hide them
    const tabContents = Array.from(guiContainer.querySelectorAll('.tab-content-rep'));
    tabContents.forEach(content => content.style.display = 'none');

    // get all elements with class="tab-link-rep" and remove the class "active"
    const tabLinks = Array.from(guiContainer.querySelectorAll('.tab-link-rep'));
    tabLinks.forEach(link => link.classList.remove('active'));
}

// opens a rep's tab contents and load molecule based on the tab clicked 
function openRepTab(evt) { 
    hideAllReps();
    let repTabId = evt.currentTarget.id;
    prevRep = currentRep;
    currentRep = getNumFromId(repTabId); 
    showCurrentRep(currentRep);
    console.log("in openRepTab, currentRep", currentRep);
}

// creates tab buttons for reps
function createRepTabButton(repTabId, active) {
    const tabButton = document.createElement('button');
    tabButton.classList.add('tab-link-rep');
    tabButton.id = repTabId;
    tabButton.textContent = 'Rep ' + getNumFromId(repTabId);
    if (active) { tabButton.classList.add('active'); }
    tabButton.addEventListener('click', (evt) => openRepTab(evt)); 

    return tabButton;
}

// shows a given rep number's contents and assigns class='active' to the tab
function showCurrentRep(repNum) {

    console.log('in showCurrentRep, this is repNum', repNum);

    let repTabId = makeRepTabId(repNum);
    let repContentId = makeRepContentId(repNum);
    
    repStates[repNum] = true;
    //currentRep = repNum;
    
    // add class 'active'
    document.getElementById(repTabId).classList.add('active');
    document.getElementById(repTabId).style.display = 'block';
        
    // show currentRepGUI
    document.getElementById(repContentId).style.display = "block"; 
}

// hides a given rep number's contents and removes class='active' from the tab
function hideRep(repNum) {

    console.log('in hideRep, this is repNum', repNum);

    let repTabId = makeRepTabId(repNum);
    let repContentId = makeRepContentId(repNum);
    
    // remove class 'active'
    document.getElementById(repTabId).classList.remove('active');
        
    // hide currentRepGUI
    document.getElementById(repContentId).style.display = "none"; 
}

function moveTabToEnd(repNum) {
    const tabContainer = document.getElementsByClassName('tab-rep')[0];
    const tab = document.getElementById(makeRepTabId(repNum));

    tabContainer.appendChild(tab); // moves tab to end of tabContainer
}


// functions to make IDs for tabs and tab contents

function makeRepTabId(id) {
    return 'rep-tab-' + id;
}

function makeRepContentId(id) {
    return 'rep-content-' + id;
}

function makeSMTabId(id, SMtype) {
    return SMtype + '-tab-' + id;
}

function makeSMContentId(id, SMtype) {
    return SMtype + '-content-' + id;
}


// when add rep button is clicked, "add" a new tab
function onAddRepClick () {
    if (numRepTabs < maxRepTabs) {
        numRepTabs++;

        for (let i = 0; i < maxRepTabs; i++) {

            // if current tab in array repStates is marked true, skip (rep already in use)
            if (repStates[i]) { 
                continue;
            }

            // if current tab in array repStates is marked false, rep isn't in use

            repStates[i] = true; // mark current rep in use

            hideAllReps();

            currentRep = i;
            moveTabToEnd(currentRep);
            showCurrentRep(currentRep);

            console.log("currentRep", currentRep);

            // show appropriate molecule 
            showMolecule(defaultParams.repParams.representation, currentRep, 'residue', 'all', 'Name'); // use default style CPK

            break;
        }

    } else {
        console.log("Maximum number of GUIs reached");
    }
}

function resetTab(repNum) {  
    let gui = guis[repNum];

    // loop through each controller to reset value to default value
    gui.controllers.forEach( controller => {

        // find matching menu from defaultParams for the controller
        let menu = Object.keys(defaultParams).find(key => Object.keys(defaultParams[key])[0] == Object.keys(controller.object)[0]);

        // get controller's property (e.g. 'representation')
        let property = controller.property; 
       
        // assign controller the value from defaultParams
        controller.object[property] = defaultParams[menu][property];

        controller.updateDisplay();
    })

    let moleculeGUIdiv = document.getElementById(makeRepContentId(repNum));

    moleculeGUIdiv.dataset.currentColorValue = defaultParams.colorParams.color; // TODO stop hardcoding these later
    moleculeGUIdiv.dataset.previousStyle = defaultParams.repParams.representation;
    moleculeGUIdiv.dataset.currentStyle = defaultParams.repParams.representation;
    moleculeGUIdiv.dataset.currentSelectionMethod = 'residue';
    moleculeGUIdiv.dataset.currentSelectionValue = 'all';

    //console.log('reset', moleculeGUIdiv);


}

function resetMoleculeColor(repNum) { // might also have argument style? decide later
    root.traverse( (obj) => {
        //console.log('obj', obj);
        if (obj.isMesh && obj.repNum == repNum) {
            obj.material.color.set(new THREE.Color(obj.originalColor));
        }
    })
}

// when delete rep button is clicked, "delete" currently active rep
function onDeleteRepClick () {
    if (numRepTabs > 1) {
        
        numRepTabs--;

        
        // hide appropriate molecule
        let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));
        console.log("moleculeGUIdiv", moleculeGUIdiv);
        let currentStyle = moleculeGUIdiv.dataset.currentStyle;

        console.log('in onDeleteRepClick, hiding', currentStyle, currentRep); 

        // reset atoms to default color
        resetMoleculeColor(currentRep);

        hideMolecule(currentStyle, currentRep);

        // hide all reps
        hideAllReps();

        // hide rep 
        tabs[currentRep].style.display = 'none';

        // reset rep's GUIs
        resetTab(currentRep);

        repStates[currentRep] = false;


        // show an existing rep
        for (let i = maxRepTabs - 1; i >= 0; i--) {
            if (repStates[i]) {
                currentRep = i;
                showCurrentRep(currentRep);
                break;
            }
        }

    } else {
        console.log("Cannot delete rep, only one left");
    }
}


// helper functions for creating selection method tabs and contents

function openSelectionMethodTab(event, SMtype) { 
    //console.log('in openSelectionMethodTab');
    //console.log('event.currentTarget.id', event.currentTarget.id);

    currentRep = getNumFromId(event.currentTarget.id);
    //console.log('currentRep', currentRep);
    const smContentId = makeSMContentId(currentRep, SMtype);
    //console.log('smContentId', smContentId);
    const repContainer = document.getElementById('rep-content-' + currentRep);

    // get all elements with class="tab-content-selection-method" and hide them, within currentRep's div
    const tabContents = Array.from(repContainer.querySelectorAll('.tab-content-selection-method'));
    tabContents.forEach(content => content.style.display = 'none');

    // get all elements with class="tab-link" and remove the class "active"
    const tabLinks = Array.from(repContainer.querySelectorAll('.tab-link-selection-method'));
    tabLinks.forEach(link => link.classList.remove('active'));

    // show the current tab and add an "active" class to the button that opened the tab
    //console.log("document.getElementById(smContentId)", document.getElementById(smContentId));
    document.getElementById(smContentId).style.display = "block";
    //console.log("changed this smContentId to block", smContentId);
    event.currentTarget.classList.add('active');
}

// function to create tab buttons for selection methods
function createSelectionMethodTabButton(buttonText, active) {
    const tabButton = document.createElement('button');
    tabButton.classList.add('tab-link-selection-method');
    tabButton.textContent = buttonText;
    tabButton.id = makeSMTabId(currentRep, buttonText.toLowerCase());
    if (active) { tabButton.classList.add('active'); }
    tabButton.addEventListener('click', (evt) => openSelectionMethodTab(evt, buttonText.toLowerCase()));

    return tabButton;
}

// function to create tab content for selection methods
function createSelectionMethodTabContent(SMtype, menus = [], display) {
    const tabContent = document.createElement('div');
    let smTabId = makeSMContentId(currentRep, SMtype);
    tabContent.id = smTabId;
    tabContent.classList.add('tab-content-selection-method', SMtype);
    if (!display) { tabContent.style.display = 'none'; }
    menus.forEach(menu => tabContent.appendChild(menu.domElement));

    return tabContent;
}

// function to create a GUI for each of the maxRepTabs reps
function createGUIs() {

    // get container to hold all the GUIs 
    const moleculeGUIContainer = document.getElementsByClassName('three-gui')[0];
    
    for (let i = 0; i < maxRepTabs; i++) {

        currentRep = i;

        // get tab rep container
        const tabRepContainer = document.getElementsByClassName("tab-rep")[0];
        
        // create tab button
        const tab = createRepTabButton(makeRepTabId(i), false);

        // append tab button to tab container
        tabRepContainer.appendChild(tab);

        // create new div for single GUI
        const moleculeGUIdiv = document.createElement('div');
        moleculeGUIdiv.classList.add('gui-div', 'tab-content-rep');
        const repContentId = makeRepContentId(i);
        moleculeGUIdiv.id = repContentId;

        // create new GUI
        const moleculeGUI = new GUI({ autoPlace: false }); 

        // creates a deep copy of defaultParams instead of referencing the original dictionary
        let params = JSON.parse(JSON.stringify(defaultParams));

        // store everything in their respective arrays
        tabs.push(tab);
        guis.push(moleculeGUI); 
        guiContainers.push(moleculeGUIdiv);

        // menus for the gui
        const styleMenu = moleculeGUI.add(params.repParams, 'representation', [CPK, VDW, lines]);
        const colorMenu = moleculeGUI.add(params.colorParams, 'color', ['Name', 'Blue', 'Green', 'Red']);
        const atomMenu = moleculeGUI.add(params.atomParams, 'atom');
        const residueMenu = moleculeGUI.add(params.residueParams, 'residue');
        const chainMenu = moleculeGUI.add(params.chainParams, 'chain'); 
        const withinMenu = moleculeGUI.add(params.withinParams, 'within');
        const withinDropdown = moleculeGUI.add(params.withinDropdownParams, 'withinDropdown', ['residue', 'molecule']);
        const withinResMenu = moleculeGUI.add(params.withinResParams, 'withinRes');
        
        withinMenu.name('show all residues within');
        withinDropdown.name('of');
        withinResMenu.name('');
        styleMenu.name('drawing method');
        colorMenu.name('coloring method');
        chainMenu.name('molecule');

        // set data-current-style and data-previous-style = default style, CPK
        /* styleMenu.domElement.dataset.previousStyle = defaultParams.repParams.representation;
        styleMenu.domElement.dataset.currentStyle = defaultParams.repParams.representation; */

        /* colorMenu.domElement.dataset.previousColor = defaultParams.colorParams.color;
        colorMenu.domElement.dataset.currentColor = defaultParams.colorParams.color; */

        /* colorMenu.domElement.dataset.previousColor = defaultParams.colorParams.color;

        atomMenu.domElement.dataset.selection = defaultParams.atomParams.atom;
        residueMenu.domElement.dataset.selection = defaultParams.residueParams.residue;
        chainMenu.domElement.dataset.selection = defaultParams.chainParams.chain;
        withinMenu.domElement.dataset.selection = defaultParams.withinParams.within;
        withinDropdown.domElement.dataset.selection = defaultParams.withinDropdownParams.withinDropdown;
        withinResMenu.domElement.dataset.selection = defaultParams.withinResParams.withinRes; */

        // might just do this (rep-content-0 div) to store data instead of each individual menu?
        moleculeGUIdiv.dataset.previousStyle = defaultParams.repParams.representation;
        moleculeGUIdiv.dataset.currentStyle = defaultParams.repParams.representation;
        moleculeGUIdiv.dataset.currentSelectionMethod = 'residue';
        moleculeGUIdiv.dataset.currentSelectionValue = defaultParams.residueParams.residue;
        moleculeGUIdiv.dataset.currentColorValue = defaultParams.colorParams.color;
    
        // on change functions for GUIs

        residueMenu.onFinishChange((value) => { 
            /* //console.log("residueMenu.parent", residueMenu.parent);
            let siblings = residueMenu.parent.children;

            // TODO change everything to use moleculeGUIdiv
            let styleMenu = siblings.find(obj => obj.property == 'representation');
            let styleMenuElement = styleMenu.domElement;
            //console.log("styleMenuElement", styleMenuElement); */

            let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));
            let currentStyle = moleculeGUIdiv.dataset.currentStyle;
            //console.log('currentStyle does this work', currentStyle);

            let currentColorValue = moleculeGUIdiv.dataset.currentColorValue;


            if (!isNaN(value) && Number.isInteger(Number(value))) { // if value is not NaN and value is an integer
                //console.log("Number entered:", Number(value));

                if (residues[Number(value)]) { // value does exist in the residues list, this returns true

                    residueSelected = Number(value); // set residueSelected to the residue we want to select
                    moleculeGUIdiv.dataset.currentSelectionMethod = 'residue';
                    moleculeGUIdiv.dataset.currentSelectionValue = residueSelected;
                    hideMolecule(currentStyle, currentRep);
                    showMolecule(currentStyle, currentRep, 'residue', residueSelected, currentColorValue);  
                    removeErrorMessages();

                } else { // value does not exist in the residues list

                    displayErrorMessage("Please select a valid residue.");
                    console.log("please select a valid residue");

                }
            } else if (value.toLowerCase() === "all") { // display entire molecule

                console.log("Option 'all' selected");
                residueSelected = 'all';
                moleculeGUIdiv.dataset.currentSelectionMethod = 'residue';
                moleculeGUIdiv.dataset.currentSelectionValue = residueSelected;
                
                //resetScene();
                hideMolecule(currentStyle, currentRep);
                showMolecule(defaultParams.repParams.representation, currentRep, 'residue', residueSelected, currentColorValue); 
                removeErrorMessages();

            } else {
                // pop up text, flashing?
                displayErrorMessage("Invalid input. Please enter a number or 'all'.");
                console.log("Invalid input. Please enter a number or 'all'.");
            }
        })

        chainMenu.onFinishChange((value) => {

            // find currentStyle
            //console.log("chainMenu.parent", chainMenu.parent);
            //let siblings = residueMenu.parent.children;
            let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));

            if (value.toLowerCase() == 'abl kinase') {
                value = 'A';
            } else if (value.toLowerCase() == 'drug') {
                value = 'D';
            }

            /* let styleMenu = siblings.find(obj => obj.property == 'representation');
            let styleMenuElement = styleMenu.domElement; */
            //console.log("styleMenuElement", styleMenuElement);

            let currentStyle = moleculeGUIdiv.dataset.currentStyle;
            let currentColorValue = moleculeGUIdiv.dataset.currentColorValue;

            if (chains.includes(value) || value.toLowerCase() == 'backbone') { // value does exist in the chains list or value is 'backbone'

                chainSelected = value; // set chainSelected to the chain we want to select
                //console.log('chainSelected', chainSelected);

                moleculeGUIdiv.dataset.currentSelectionMethod = 'chain';
                moleculeGUIdiv.dataset.currentSelectionValue = chainSelected;

                hideMolecule(currentStyle, currentRep);
                showMolecule(currentStyle, currentRep, 'chain', chainSelected, currentColorValue);  
                removeErrorMessages();

            } else if (value == 'all') {

                moleculeGUIdiv.dataset.currentSelectionMethod = 'chain';
                moleculeGUIdiv.dataset.currentSelectionValue = value;
                showMolecule(currentStyle, currentRep, 'chain', value, currentColorValue);  
                removeErrorMessages();

            } else { // value does not exist in the chains list

                displayErrorMessage("Please select a valid molecule.");
                console.log("please select a valid chain:", chains);

            }
        })

        colorMenu.onChange((value) => {
            //console.log("colorMenu value changed: ", value);

            /* let siblings = colorMenu.parent.children;

            console.log('value', value);

            let styleMenu = siblings.find(obj => obj.property == 'representation');
            let styleMenuElement = styleMenu.domElement;
            console.log("styleMenuElement", styleMenuElement);

            currentStyle = styleMenuElement.dataset.currentStyle;
            console.log('currentStyle does this work', currentStyle); */

            
            let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));
            //console.log('moleculeGUIdiv', moleculeGUIdiv);
            moleculeGUIdiv.dataset.currentColorValue = value;
            //console.log("MOLECULEGUIDIV CHANGED TO ", moleculeGUIdiv.dataset.currentColorValue);

            let style = moleculeGUIdiv.dataset.currentStyle; 
            let repNum = currentRep;
            let selectionMethod = moleculeGUIdiv.dataset.currentSelectionMethod;
            let selectionValue = moleculeGUIdiv.dataset.currentSelectionValue;
            let colorValue = value;

            colorChange(repNum, style, colorValue);
            
            //showMolecule(style, repNum, selectionMethod, selectionValue, colorValue);

        })

        function displayErrorMessage (message) {
            let atomContent = document.getElementsByClassName('atom-content')[0];
            let error_para = document.createElement('p');
            error_para.textContent = message;
            error_para.classList.add("error-para");
            atomContent.appendChild(error_para); 
            //console.log(atomContent);
        }

        function removeErrorMessages() {
            Array.from(document.getElementsByClassName('error-para')).forEach( (elem) => elem.remove() );
        }

        // helper function to validate residue number
        function validateResidue(resNum) {
            //console.log('in validateResidue');

            if (!isNaN(resNum) && Number.isInteger(Number(resNum))) { // if value is not NaN and value is an integer
                //console.log("Number entered:", resNum);

                if (residues[resNum]) { // if value does exist in the residues list, this returns true
                    Array.from(document.getElementsByClassName('error-para')).forEach( (elem) => elem.remove() );
                    return resNum;
                } else { // value does not exist in the residues list

                    let atomContent = document.getElementsByClassName('atom-content')[0];
                    let error_para = document.createElement('p');
                    error_para.textContent = "Please select a valid residue.";
                    error_para.classList.add("error-para");
                    atomContent.appendChild(error_para); 
                    //console.log(atomContent);

                    console.log("please select a valid residue");
                    return false;
                }
            } else {
                // pop up text, flashing?

                let atomContent = document.getElementsByClassName('atom-content')[0];
                let error_para = document.createElement('p');
                error_para.textContent = "Invalid input. Please enter a number or 'all'.";
                error_para.classList.add("error-para");
                atomContent.appendChild(error_para); 


                console.log("Invalid input. Please enter a number or 'all'.");
                return false;
            }
        }

        // helper function to validate chain TODO
        function validateChain(chain) { // finish validate chain

            if (chain.toLowerCase() == 'abl kinase') {
                chain = 'A';
            } else if (chain.toLowerCase() == 'drug') {
                chain = 'D';
            }

            if (chains.includes(chain) || chain == 'backbone') { // value does exist in the chains list or value is 'backbone'

                chainSelected = chain; // set chainSelected to the chain we want to select
                //console.log('chainSelected', chainSelected);

                /* repContent.dataset.currentSelectionMethod = 'chain';
                repContent.dataset.currentSelectionValue = chainSelected; */

                Array.from(document.getElementsByClassName('error-para')).forEach( (elem) => elem.remove() );

                return chain; 

            } else { // value does not exist in the chains list

                let atomContent = document.getElementsByClassName('atom-content')[0];
                let error_para = document.createElement('p');
                error_para.textContent = "Please select a valid molecule.";
                error_para.classList.add("error-para");
                atomContent.appendChild(error_para); 

                console.log("please select a valid chain:", chains);
                return false;
            }
        }

        // helper function to highlight certain parts of the molecule based on the within ___ of residue ___ menu
        function withinAsResidue () {

            let startTime = new Date();
            //popup();

            const distance = params.withinParams.within;
            const type = params.withinDropdownParams.withinDropdown; 
            let value = params.withinResParams.withinRes;

            if (value.toLowerCase() == 'drug') {
                value = 'D';
            } else if (value.toLowerCase() == 'abl kinase') {
                value = 'A'
            }

            //console.log("distance", distance, 'type', type, "value", value);


            // get current style 
            let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));
            /* let siblings = residueMenu.parent.children;

            let styleMenu = siblings.find(obj => obj.property == 'representation');
            let styleMenuElement = styleMenu.domElement; */

            let currentStyle = moleculeGUIdiv.dataset.currentStyle;
            console.log('currentStyle does this work', currentStyle);

            let currentColorValue = moleculeGUIdiv.dataset.currentColorValue;

            if (type == 'residue') { // do residue number validation

                let resNum = validateResidue(value);
                if (resNum != false) { // if residue is valid

                    residueSelected = Number(resNum); // set residueSelected to the residue we want to select
                    moleculeGUIdiv.dataset.currentSelectionMethod = 'residue';
                    moleculeGUIdiv.dataset.currentSelectionValue = residueSelected;
                    hideMolecule(currentStyle, currentRep);
                    showMolecule(currentStyle, currentRep, 'distance', [distance, type, residueSelected], currentColorValue);  

                } 

            } else if (type == 'molecule') { // do chain validation LOSERRRR
                
                let moleculeVal = validateChain(value);
                if (moleculeVal != false) {

                    // maybe don't use global var chainSelected? might interfere with Selection method chain?
                    chainSelected = moleculeVal; // set chainSelected to the chain we want to select
                    //console.log('chainSelected', chainSelected);

                    moleculeGUIdiv.dataset.currentSelectionMethod = 'distance';
                    moleculeGUIdiv.dataset.currentSelectionValue = distance + " " + type + " " + value; // TODO edit here probably

                    hideMolecule(currentStyle, currentRep);
                    showMolecule(currentStyle, currentRep, 'distance', [distance, type, chainSelected], currentColorValue);  

                } 
            }
            //popdown();

            let endTime = new Date();
            calculateTime(startTime, endTime, 'time to select by distance');

        }

        withinMenu.onFinishChange(withinAsResidue);
        withinDropdown.onFinishChange(withinAsResidue);
        withinResMenu.onFinishChange(withinAsResidue);

        //
        styleMenu.onChange(function(value) {
            console.log('styleMenu changing to', value, 'with currentRep', currentRep);

            //const styleMenuElement = styleMenu.domElement;
            let moleculeGUIdiv = document.getElementById(makeRepContentId(currentRep));
            //console.log('styleMenuElement', styleMenuElement);

            moleculeGUIdiv.dataset.previousStyle = moleculeGUIdiv.dataset.currentStyle;
            moleculeGUIdiv.dataset.currentStyle = value;

            let previousStyle = moleculeGUIdiv.dataset.previousStyle; // || defaultParams.repParams.representation;  // Default to initial value (CPK) if previousStyle is uninitialized
            let currentStyle = moleculeGUIdiv.dataset.currentStyle;

            let currentColorValue = moleculeGUIdiv.dataset.currentColorValue;

            // get selection method
            /* let n = styleMenuElement.parentElement;
            let n1 = n.parentElement;
            console.log("parent ", n);
            console.log('parent of parent', n1); */
            
            let currentSelectionMethod = moleculeGUIdiv.dataset.currentSelectionMethod; 
            let currentSelectionValue = moleculeGUIdiv.dataset.currentSelectionValue;
            //console.log("currentSelectionMethod", currentSelectionMethod, "currentSelectionValue", currentSelectionValue);

            console.log('in styleMenu.onChange, hiding', previousStyle, currentRep);
            hideMolecule(previousStyle, currentRep); 
            console.log('in styleMenu.onChange, showing', currentStyle, currentRep);
            showMolecule(currentStyle, currentRep, currentSelectionMethod, currentSelectionValue, currentColorValue); 
        }); 

        // create div to hold molecule and representation options
        const molRepOptionContainer = document.createElement('div');
        molRepOptionContainer.classList.add('mol-rep-option');

        // create div to hold selection options, including [atom, residue, chain, distance]
        const selectionOptionContainer = document.createElement('div');
        selectionOptionContainer.classList.add('selection-option');
        const selectionTabContainer = document.createElement('div');
        selectionTabContainer.classList.add('tab-selection-method');

        // create tab buttons
        const tabButtonAtom = createSelectionMethodTabButton('Atom', false);
        const tabButtonResidue = createSelectionMethodTabButton('Residue', true);
        const tabButtonChain = createSelectionMethodTabButton('Molecule', false);
        const tabButtonDistance = createSelectionMethodTabButton('Distance', false);

        // create tab content
        const tabContentAtom = createSelectionMethodTabContent('atom', [atomMenu], false);
        const tabContentResidue = createSelectionMethodTabContent('residue', [residueMenu], true);
        const tabContentChain = createSelectionMethodTabContent('molecule', [chainMenu], false);
        const tabContentDistance = createSelectionMethodTabContent('distance', [withinMenu, withinDropdown, withinResMenu], false);

        // append tab buttons to tab container
        selectionTabContainer.appendChild(tabButtonAtom);
        selectionTabContainer.appendChild(tabButtonResidue);
        selectionTabContainer.appendChild(tabButtonChain);
        selectionTabContainer.appendChild(tabButtonDistance);

        // append content to content container
        selectionOptionContainer.appendChild(selectionTabContainer);
        selectionOptionContainer.appendChild(tabContentAtom);
        selectionOptionContainer.appendChild(tabContentResidue);
        selectionOptionContainer.appendChild(tabContentChain);
        selectionOptionContainer.appendChild(tabContentDistance);

        const selectionMethodPara = document.createElement('p');
        selectionMethodPara.classList.add("text");
        const text = document.createTextNode("SELECTION METHOD:");
        selectionMethodPara.appendChild(text);

        // molRepOptionContainer.appendChild(molMenu.domElement);
        molRepOptionContainer.appendChild(styleMenu.domElement);
        molRepOptionContainer.appendChild(colorMenu.domElement);

        // append everything to GUI div
        moleculeGUI.domElement.appendChild(molRepOptionContainer);
        moleculeGUI.domElement.appendChild(selectionMethodPara);
        moleculeGUI.domElement.appendChild(selectionOptionContainer);

        // add GUI to its container  
        moleculeGUIdiv.appendChild(moleculeGUI.domElement);
        moleculeGUIContainer.appendChild(moleculeGUIdiv);

        //
        /* let guiId = 'gui' + i;
        moleculeGUI.domElement.dataset.guiId = guiId;
        window.guiInstances[guiId] = moleculeGUI;   */       

        // default initialized setting: show rep 0 and hide all others
        if (i == 0) {
            repStates[i] = true;
            tab.classList.add('active');
            tab.style.display = 'block';
            moleculeGUIdiv.style.display = 'block';
            currentGUI = moleculeGUI;
        } else {
            tab.style.display = 'none';
            moleculeGUIdiv.style.display = 'none';
        }

        currentStyle = defaultParams.repParams.representation;
    }

    currentRep = 0;
}
function onWindowResize() {

    let w = container.clientWidth;
    let h = container.clientHeight;
    let aspectRatio = w / h;
    let center = getBoundingBoxCenter();

    // Adjust the camera's aspect ratio
    if (camera.isOrthographicCamera) {

        // For orthographic camera
        let currentHeight = camera.top - camera.bottom;
        let newWidth = currentHeight * aspectRatio;
        let centerX = (camera.left + camera.right) / 2;

        camera.left = centerX - newWidth / 2;
        camera.right = centerX + newWidth / 2;

    } else if (camera.isPerspectiveCamera) {

        // For perspective camera
        camera.aspect = aspectRatio;
    }

    camera.updateProjectionMatrix();
    controls.target.set(center.x, center.y, center.z);
    controls.update();

    
    // Update renderer size
    renderer.setSize(w, h);
    
    render();
}

// window resize function specific to container that this scene is in (not just entire window)
function onWindowResize1() {
    //console.log('in window resize');

    let w = container.clientWidth;
    let h = container.clientHeight;
    let viewSize = h;
    let aspectRatio = w / h;

    camera.left = (-aspectRatio * viewSize) / 2;
    camera.right = (aspectRatio * viewSize) / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
 
    //recenterCamera(camera, controls);

    camera.updateProjectionMatrix();
    
    renderer.setSize(w, h);
    render();
}

// animate the molecule (allow it to move, be clicked)
function animate() {
    //console.log("animated")
    requestAnimationFrame( animate );

    // FPS
    if (framesOn) {
        frames ++;
        const time = performance.now();
        
        if ( time >= prevTime + 1000 ) {
        
            console.log( Math.round( ( frames * 1000 ) / ( time - prevTime ) ) );
        
        frames = 0;
        prevTime = time;
        
        }
    }
    


    controls.update();
    render();
    window.addEventListener('click', raycast);
    window.addEventListener('keypress', keypress2);
    window.addEventListener('keypress', keypressEqual);
    onWindowResize();
}

// render the molecule (adding scene and camera + objects)
function render() {
    renderer.render( scene, camera );
}

// keypress event functions

// on keypress, 2
function keypress2(event) {
    if (event.key === '2') {
        if (!isDistanceMeasurementMode) {
            isDistanceMeasurementMode = true;
            document.body.style.cursor = 'cell';
            if (!selectedObject) {
                console.log("in keypress2 event, there is a selectedObject");
                resetAtomState(selectedObject); // reset selected atom state
            } else {
                console.log("in keypress2 event, there was no a selectedObject");
            };
            console.log("Distance measurement mode activated");
        } else {
            isDistanceMeasurementMode = false;
            document.body.style.cursor = 'auto';
            console.log("Distance measurement mode deactivated");
        }
    }
    
}

// on keypress, =
function keypressEqual(event) {

    if (event.key === '=') {
        console.log("in keypressEqual");
        console.log('before resetToInitialView');
        console.log(initialPosition, initialQuaternion, initialTarget);
        resetToInitialView();
            /* console.log(initialPosition, initialQuaternion, initialTarget);
            recenterCamera(camera, controls);
            resetMoleculeOrientation(); */

        console.log('after resetToInitialView');
        console.log(initialPosition, initialQuaternion, initialTarget);

        recenterCamera(camera, controls);
    }
}

function tempReset () {
    console.log("in keypressEqual");
        console.log('before resetToInitialView');
        console.log(initialPosition, initialQuaternion, initialTarget);
        resetToInitialView();
            /* console.log(initialPosition, initialQuaternion, initialTarget);
            recenterCamera(camera, controls);
            resetMoleculeOrientation(); */

        console.log('after resetToInitialView');
        console.log(initialPosition, initialQuaternion, initialTarget);

        recenterCamera(camera, controls);
}

function resetToInitialView() {
    console.log("Resetting to initial molecule view");

    camera.position.copy(initialPosition);
    camera.quaternion.copy(initialQuaternion);
    
    controls.target.copy(initialTarget);
    controls.update();
    controls.reset();  // Apply changes to controls

    camera.updateProjectionMatrix();
}

// resets molecule to original orientation and camera angle
// TODO might have to edit this one not sure what's going on with conditionals
function resetMoleculeOrientation () {
    console.log("inside resetMolecule, entire molecule");

    //recenterCamera(camera, controls);
    storeInitialView();
    controls.update();
    camera.updateProjectionMatrix();
    controls.reset();
    /* if (residueSelected == 'all') {
        
    } else {
        console.log("inside resetMolecule, part of molecule");
    } */
}

const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", tempReset); 

const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", function () {
    console.log("in clearButton event listener");
    resetScene();
    
    loadMolecule(defaultParams.mculeParams.molecule, CPK, 0);

    resetEverything();
})


// functions to manipulate atom states

function resetAtomState(atom) {

    // resets atom state to default non-wire frame and color
    if (atom == null) {
        return;
    };

    let moleculeGUIdiv = document.getElementById(makeRepContentId(atom.repNum));
    let currentColorValue = moleculeGUIdiv.dataset.currentColorValue;
    console.log('atom', atom);
    console.log('currentColorValue', currentColorValue);
    
    if (currentColorValue == 'Name') {
        //obj.material.color.set(new THREE.Color(obj.originalColor));
        atom.material.color.set(new THREE.Color(atom.originalColor));
    } else if (currentColorValue == 'Blue') {
        atom.material.color.set(new THREE.Color('rgb(0, 0, 255)'));
    } else if (currentColorValue == 'Green') {
        atom.material.color.set(new THREE.Color('rgb(0, 255, 0)'));
    } else if (currentColorValue == 'Red') {
        atom.material.color.set(new THREE.Color('rgb(255, 0, 0)'));
    } 
 
    atom.material.wireframe = false; // TODO, can change representation once clicked 
    atom.material.emissive.set(0x000000);
    console.log("atom reset:", atom);
    return;
};

function switchAtomState(atom) {
    // switches atom state from previous state
    if (atom.material.wireframe) {
        atom.material.wireframe = false;
        atomContent.innerHTML = '<p> selected atom: <br>none </p>'; 
    } else {
        console.log("atom: ", atom);
        var val = atom.atomValue;
        console.log("val:", val);
        var selectedAtom = json_atoms.atoms[val]; // ex: [1.67, 2.96, 1.02, [255, 255, 255], 'H']
    
        mainColor = new THREE.Color('rgb(' + selectedAtom[ 3 ][ 0 ] + ',' + selectedAtom[ 3 ][ 1 ] + ',' + selectedAtom[ 3 ][ 2 ] + ')'); 
        atom.material.wireframe = true;
        atomContent.innerHTML = '<p> selected atom: <br>' + selectedAtom[4][0] + '<\p>';   
    };
};

function calculateDistance(object1, object2) { // could combine with drawLine
    let x1 = object1.position.x / 75;
    let y1 = object1.position.y / 75;
    let z1 = object1.position.z / 75;
    let x2 = object2.position.x / 75;
    let y2 = object2.position.y / 75;
    let z2 = object2.position.z / 75;

    // console.log(x1, y1, z1, x2, y2, z2);

    let distance = ((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)**(1/2);
    return distance.toFixed(4);
};

function calculateDistanceXYZ(ls1, ls2) {
    let x1 = ls1[0] / 75;
    let y1 = ls1[1] / 75;
    let z1 = ls1[2] / 75;
    let x2 = ls2[0] / 75;
    let y2 = ls2[1] / 75;
    let z2 = ls2[2] / 75;

    //console.log(x1, y1, z1, x2, y2, z2);

    let distance = ((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)**(1/2);
    return distance.toFixed(4);
}

function drawLine(object1, object2) {
    let distance = calculateDistance(object1, object2);

    let x1 = object1.position.x;
    let y1 = object1.position.y;
    let z1 = object1.position.z;
    let x2 = object2.position.x;
    let y2 = object2.position.y;
    let z2 = object2.position.z;

    const material = new THREE.LineDashedMaterial( {
        color: 0xffffff,
        linewidth: 1,
        scale: 1,
        dashSize: 3,
        gapSize: 1,
    } );

    // draw line between two atoms
    const points = [];
    points.push(new THREE.Vector3(x1, y1, z1));
    points.push(new THREE.Vector3(x2, y2, z2));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    root.add(line);

    // create text to display distance
    const canvas = document.createElement('canvas');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;  
    canvas.height = containerHeight; 

    const context = canvas.getContext('2d');

    context.fillStyle = 'green';
    context.font = '60px sans-serif';
    context.textAlign = 'center';   
    context.textBaseline = 'middle';  

    let x_cor = (x1 + x2) / 2;
    let y_cor = (y1 + y2) / 2; 
    let z_cor = (z1 + z2) / 2;

    /* console.log("distance", distance.toString());
    console.log("canvas.width/2: ", containerWidth/2);
    console.log("canvas.height/2: ", containerHeight/2); */
    context.fillText(distance, canvas.width / 2, canvas.height/2);

    // Create the texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create a SpriteMaterial with the canvas texture
    const textMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    // Create a Sprite using the material
    const sprite = new THREE.Sprite(textMaterial);

    // Set the size of the sprite (scale)
    sprite.scale.set(250, 250, 1); // Adjust scale according to your needs

    sprite.position.set(x_cor+50, y_cor, z_cor);

    line.add(sprite);

    renderer.render(scene, camera);
}

// on click 
function raycast(event)
{
    //get mouse location specific to given container size 
    var rect = renderer.domElement.getBoundingClientRect();
    var containerRect = container.getBoundingClientRect(); // Get container's bounding rectangle
    mouse.x = ((event.clientX - rect.left) / containerRect.width) * 2 - 1; // Adjust for container's width
    mouse.y = -((event.clientY - rect.top) / containerRect.height) * 2 + 1; // Adjust for container's height
    raycaster.setFromCamera( mouse, camera );  


    //does the mouse intersect with an object in our scene?! 
    var intersects = raycaster.intersectObjects( scene.children );
    //console.log("intersects", intersects);
    //console.log("length", intersects.length);
   
    if (intersects.length > 0) { // if there is stuff intersected with the mouse

        let numAtoms = 0
        var currentAtom;

        intersects.forEach(obj => {
            if (obj.object.visible == true) {
                let objType = obj.object.type;

                if (objType == "Mesh") {
                    if (obj.object.molecularElement == "atom") {
                        numAtoms = numAtoms + 1;
                        console.log("this is a mesh atom object");
                        currentAtom = obj.object;
                    }
                }
            }
            
        });

        if (numAtoms == 0) {
            return;
        };

        var previousAtom = selectedObject;
        //var currentAtom = intersects[0].object;

        selectedObject = currentAtom;

        //console.log("previously selected atom is", previousAtom);
        //console.log("currently selected atom is", currentAtom);

        if (isDistanceMeasurementMode) { // if selectionMode is on to measure distance between atoms
            //console.log("isDistanceMeasurementMode on");

            if (distanceMeasurementAtoms.length == 0) {
                console.log("only one atom so far");
                distanceMeasurementAtoms.push(currentAtom); // now the array has 1 atom in it
                return;
            } else if (distanceMeasurementAtoms.length == 1) {
                //console.log("now two atoms");
                distanceMeasurementAtoms.push(currentAtom); // now the array has 2 atoms in it
                //console.log(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1])

                drawLine(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]);
                var bond_para = document.createElement('p')
                //console.log(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]);
                bond_para.textContent = 'bond length: ' + calculateDistance(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]).toString();
                bond_para.classList.add("bond-length");
                atomContent.appendChild(bond_para); 
            } else {
                //console.log("too many atoms, cleared");
                distanceMeasurementAtoms = []; // clear array
                distanceMeasurementAtoms.push(currentAtom); // now the array has 1 atom in it
                return;
            };

        } else {
            if (!(previousAtom == null)) { // if there was a previously-selected object
                if (previousAtom == currentAtom) { // if previous selected object is the same as currently selected object
                    switchAtomState(currentAtom); // switch current atom's state
                    return;
                } else { // if clicking on a different atom
                    resetAtomState(previousAtom); // reset previously-clicked atom
                    switchAtomState(currentAtom); // switch current atom's state
                    return;
                };
            } else { // if there was no previously-selected object
                switchAtomState(currentAtom); // switch current atom's state
                return;
            }            
        };  
    } else {
        // console.log("doesn't intersect");
    }
} 

/* function popup() {
    console.log('inside popup');
    let popup = document.getElementById("loading-popup");
    popup.style.display = 'block';
    console.log(popup);
}

function popdown() {
    console.log('inside popdown');
    let popup = document.getElementById("loading-popup");
    popup.style.display = "none";
    console.log(popup);
} */


// get radius size of a given atom name 
function getRadius(atom){
    let rad; 

    if(atom == "Br"){
        rad = 1.83 }

    if(atom == "C"){
        rad = 1.7 }

    if(atom == "Cl"){
        rad = 1.75}

    if(atom == "F"){
        rad = 1.35 }

    if(atom == "H"){
        rad = 1.2 }

    if(atom == "N"){
        rad = 1.55 }

    if(atom == "O"){
        rad = 1.52 }

    if(atom == "S"){
        rad = 1.80 }

    return rad; 
}


