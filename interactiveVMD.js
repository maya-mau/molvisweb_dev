
//import three js and all the addons that are used in this script 
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { PDBLoader } from '/mymods/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';



console.log("start script")


//initialize the baseline objects  
let camera, scene, renderer, labelRenderer, container;
let controls;
let root;
let geometryAtoms, geometryBonds, json_atoms, json_bonds, json_bonds_manual, json_bonds_conect;
//let outlinePass, composer;
var raycaster, mouse = {x: 0, y: 0 }

let initialPosition, initialTarget, initialQuaternion;

const PDBloader = new PDBLoader();
const OBJloader = new OBJLoader();
const MTLloader = new MTLLoader(); 
const offset = new THREE.Vector3();

var selectedObject = null;
// variables to keep track of atoms to have distance measured between them
var distanceSelected1 = null;
var distanceSelected2 = null;

var distanceMeasurementAtoms = [];
var mainColor = null; 
const atomContent = document.getElementsByClassName('atom-content')[0];

//set key controls, TODO find a place to move it
var isDistanceMeasurementMode = false

// amount of molecule selected, may change
var residueSelected = 'all'; // default all
 
//specific settings for the raycaster (clicker) that make it senstitive enough to distinguish atoms 
raycaster = new THREE.Raycaster();
raycaster.near = .1;
raycaster.far = Infinity;
raycaster.params.Points.threshold = 0.1; 
raycaster.params.Line.threshold = 0.1;  

//names to display + associated filename of pdb files 
const MOLECULES = {
    'Ponatinib': 'ponatinib_Sep2022.pdb',
    'Caffeine': 'caffeine.pdb',
    "Ablkinase": 'Ablkinase.pdb'
};

//setting default/on load molecule  
const mculeParams = {
    molecule: 'caffeine.pdb'
};

//setting default/on load representation   
const repParams = {
    representation: 'CPK',
};

//setting default/on load representation   
const toggleParams = {
    toggle: 'all'
};

const residueParams = {
    residue: 'all'
};

//call everything! 
init();
animate();

//init function - sets up scene, camera, renderer, controls, and gui 
function init() {

    // TODO attempt at orthographic camera
    /* container = document.getElementsByClassName('column middle')[0]; // could try fixing the squish TODO
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let w = containerWidth;
    let h = containerHeight;
    let viewSize = h;
    let aspectRatio = w / h;

    let left = (-aspectRatio * viewSize) / 2;
    let right = (aspectRatio * viewSize) / 2;
    let top = viewSize / 2;
    let bottom = -viewSize / 2;
    let near = -100;
    let far = 100; */

    //initialize main window 
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    //gives the user a specific viewpoint of the scene 
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
    //camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    
    camera.position.z = 1000; // could set camera to orthoperspective for toggle TODO
    scene.add( camera );

    //object needs to be illuminated to be visible // TODO, could work on this, lighting is kind of strange
    var ambientLight = new THREE.AmbientLight ( 0xffffff, 1)
    scene.add( ambientLight )

    const light1 = new THREE.DirectionalLight( 0xffffff, 2.5 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light2.position.set(  1, - 1, -1 );
    scene.add( light2 );

    // root contains all the objects of the scene 
    root = new THREE.Group();
    scene.add( root );

    // renderer makes scene visible 
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);

    // place the scene in the column middle window 
    container = document.getElementsByClassName('column middle')[0]; // could try fixing the squish TODO
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

    //allow user to move around the molecule 
    controls = new TrackballControls( camera, renderer.domElement ); // TODO, controls zooming out boundaries
    controls.minDistance = 100;
    controls.maxDistance = 3000;

    initialPosition = camera.position.clone();
    initialQuaternion = camera.quaternion.clone();
    initialTarget = controls.target.clone();

    // the default/first molecule to show up 
    loadMolecule( mculeParams.molecule, 'CPK');

    // dynamic screen size 
    window.addEventListener( 'resize', onWindowResize );

    // container to hold the gui + location // everything below here is the left panel options
    const moleculeGUIContainer = document.createElement('div');
    moleculeGUIContainer.className = 'three-gui';
    document.getElementsByClassName( 'column left' )[0].appendChild(moleculeGUIContainer);
    
    // menus for the gui -- molecule & representation & toggle
    const moleculeGUI = new GUI({ autoPlace: false }); 
    const molMenu = moleculeGUI.add(mculeParams, 'molecule', MOLECULES);
    const repMenu = moleculeGUI.add(repParams, 'representation', ['CPK', 'VDW', 'lines']);
    const residueMenu = moleculeGUI.add(residueParams, 'residue'); 

    residueMenu.onFinishChange((value) => { // TODO consider difference between .onFinishChange and .onChange for others; onFinishChange require press enter to change
        
        if (!isNaN(value) && Number.isInteger(Number(value))) { // if value is not NaN and value is an integer
            console.log("Number entered:", Number(value));
            residueSelected = Number(value); // set residueSelected to the residue we want to select
            loadMolecule(mculeParams.molecule, repParams.representation);

        } else if (value.toLowerCase() === "all") { // display entire molecule
            console.log("Option 'all' selected");
            residueSelected = 'all';
            loadMolecule(mculeParams.molecule, repParams.representation); 

        } else {
            // pop up text, flashing?
            console.log("Invalid input. Please enter a number or 'all'.");
        }
    }); 

    //when representation changes, selected molecule stays the same 
    repMenu.onChange(function(value) {
        switch (value) {
            case 'CPK':
                loadMolecule(mculeParams.molecule, 'CPK');
                break;
            case 'VDW':
                loadMolecule(mculeParams.molecule, 'VDW');
                break;
            case 'lines':
                loadMolecule(mculeParams.molecule, 'lines'); // TODO lines color doesn't work
                break;
            default:
                break;
        }
    }); 

    //when molecule changes, selected representation stays the same 
    molMenu.onChange(function(value) {
        console.log("trying to load", mculeParams.molecule);
        residueSelected = 'all';
        loadMolecule(mculeParams.molecule, repParams.representation);
        resetMoleculeOrientation();
    });

    //add our gui to its container home 
    moleculeGUIContainer.appendChild(moleculeGUI.domElement);
}

// from the given pdb and given representation style, load molecule into scene 
function loadMolecule( model, rep ) { // origin is perhaps an atom? distance for min dist
    console.log("inside loadMolecule");

    //grab model file 
    const url = '/models/molecules/' + model;
    
    //initialize geometries that will change based on representation 
    let boxGeometry, sphereGeometry; // stretched out square for bonds, atoms as spheres

    //reset the scene because something new is being loaded 
    while ( root.children.length > 0 ) {
        const object = root.children[ 0 ];
        object.parent.remove( object );
    }

    // load by the pdb file 
    PDBloader.load( url, function ( pdb ) {
        // properties of pdb loader that isolate the atoms & bonds
        console.log("inside PDBloader");
        let manual = true; // TO DO - use manual for now, implement options for manual OR conect later

        if (manual) { 
            geometryBonds = pdb.geometryBondsManual; 
        } else { 
            geometryBonds = pdb.geometryBondsConect;
        }

        console.log("pdb.geometryBondsManual", pdb.geometryBondsManual.attributes.position.array);

        geometryAtoms = pdb.geometryAtoms;

        json_atoms = pdb.json_atoms;
        json_bonds_manual = pdb.json_bonds_manual.bonds_manual;
        json_bonds_conect = pdb.json_bonds_conect.bonds_conect;

        json_bonds = json_bonds_manual;

        console.log("json_atoms", json_atoms);
        console.log("json_bonds_manual", json_bonds_manual);
        console.log("json_bonds_conect", json_bonds_conect);

        // change starting box/sphere contents based on rep style 
        if( rep == 'CPK' ){
            //thin bonds, consistently sized atoms 
            boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
            sphereGeometry = new THREE.IcosahedronGeometry(1, 3 ); //radius 
        }
        
        if( rep == 'lines' ){
            // slightly thicker bonds for visibility, no atoms 
            boxGeometry = new THREE.BoxGeometry( 3, 3, 1 );
            sphereGeometry = new THREE.BoxGeometry(.5, .5, .5); //radius 
        }

        //vdw is set up later 

        //starting setup to put atoms into scene 
        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate(); // the offset moves the center of the bounding box to the origin?
        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );
        console.log("offset", offset.x, offset.y, offset.z );

        //grab atom content from pdb so their position and color go along 
        let positions = geometryAtoms.getAttribute( 'position' );
        const colors = geometryAtoms.getAttribute( 'color' );
        const position = new THREE.Vector3();
        var color = new THREE.Color(0xffffff);

        // LOAD IN ATOMS 
        for ( let i = 0; i < positions.count; i ++ ) {
            // loop through the positions array to get every atom 
            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            /* let dist_from_origin = ((position.x - x1)**2 + (position.y - y1)**2 + (position.z - z1)**2)**(1/2);
            
            if (dist_from_origin > distance) {
                continue;
            } */

            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );

            const material = new THREE.MeshPhongMaterial();

            //sphere visuals if VDW 
            if( rep == 'VDW' ){
                //radius depends on atom and is scaled up for viewing 
                const rad = getRadius(json_atoms.atoms[i][4])*2
                sphereGeometry = new THREE.IcosahedronGeometry(rad, 3 ); //radius 
            } 
            
            // create atom object that is a sphere w the position, color, and content we want 
            const object = new THREE.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 ); // TODO figure out why scaling
            object.scale.multiplyScalar( 25 );

            object.molecularElement = "Atom";

            if( !(rep == 'lines') ){
                // all white for lines model so atoms blend in 
                object.material.color.set(color);
            } 
            
            // reference to original pdb within object for raycaster 
            object.atomValue = i; 

            //add atom object to scene 
            root.add( object );

            if (residueSelected != 'all') { // if residueSelected is not 'all' option
                if (json_atoms.atoms[i][5] != residueSelected) {
                    object.visible = false;
                }
            }
        }

        // setup for bond loading 
        positions = geometryBonds.getAttribute( 'position' );
        console.log("positions", positions);
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        // LOAD IN BONDS 
        console.log("json_bonds", json_bonds);

        console.log("length", positions.count);

        for ( let i = 0; i < positions.count; i += 2 ) {
            //console.log("START OF LOOP");
            let bond = json_bonds[i/2]; // loops through bonds 0 to however many bonds there are, divide by 2 because i increments by 2 
            //console.log("bond[0]", bond[0]-1);
            
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
    
            //make bond a rectangular prism & add it to scene 
            const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
            object.position.copy( start );
            object.position.lerp( end, 0.5 );
            object.scale.set( 5, 5, start.distanceTo( end ) );
            object.molecularElement = "Bond";
            object.lookAt( end );
            root.add( object );

            if (residueSelected != 'all') { // if residueSelected is not 'all' option
                
                if (atom1[5] != residueSelected || atom2[5] != residueSelected) { 
                    object.visible = false;
                }
            }
        }
        
        // render the scene after adding all the new atom & bond objects             
        render();
    } );
}

// window resize function specific to container that this scene is in (not just entire window)
function onWindowResize() {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(containerWidth, containerHeight);
    render();
}

// animate the molecule (allow it to move, be clicked)
function animate() {
    console.log("animated")
    requestAnimationFrame( animate );
    controls.update();
    render();
    window.addEventListener('click', raycast);
    window.addEventListener('keypress', keypress2);
    window.addEventListener('keypress', keypressEqual);
}

// render the molecule (adding scene and camera + objects)
function render() {
    renderer.render( scene, camera );
}

// keypress event functions

//on keypress, 2
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
        };
    };
};

//on keypress, =
function keypressEqual(event) {
    if (event.key === '=') {
        console.log("in keypressEqual");
        resetMoleculeOrientation();
    }
}

// resets molecule to original orientation and camera angle
function resetMoleculeOrientation () {
    if (residueSelected == 'all') {
        console.log("inside resetMolecule, entire molecule");
        camera.position.copy(initialPosition);
        camera.quaternion.copy(initialQuaternion);
        controls.reset();
        renderer.render(scene, camera);
    } else {
        console.log("inside resetMolecule, part of molecule");

    }
}

const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", resetMoleculeOrientation);

const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", function () {
    console.log("in clearButton event listener");
    loadMolecule(mculeParams.molecule, 'CPK');
})

// functions to manipulate atom states
function resetAtomState(atom) {
    // resets atom state to default non-wire frame and color
    if (atom == null) {
        return;
    };
    
    console.log("main color: ", mainColor);
    atom.material.color.set(mainColor); 
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
        console.log("selectedAtom", selectedAtom);
    
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

// Function to create the label as a sprite
function createTextSprite(message, fontSize, fontColor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    context.font = `${fontSize}px Arial`;
    context.fillStyle = fontColor;
    context.fillText(message, 0, fontSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    // Scale the sprite depending on the font size and message length
    // sprite.scale.set(2, 1, 1);
    
    return sprite;
};

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

    console.log("line drawn");
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
    console.log("intersects", intersects);
    console.log("length", intersects.length);
   
    //if so... 
     if (intersects.length > 0) { // if there is stuff intersected with the mouse
        console.log("intersects");

        let numAtoms = 0
        var currentAtom;

        intersects.forEach(obj => {
            let objType = obj.object.type;

            if (objType == "Mesh") {
                if (obj.object.molecularElement == "Atom") {
                    numAtoms = numAtoms + 1;
                    console.log("this is a mesh atom object");
                    currentAtom = obj.object;
                }
            }
        });

        if (numAtoms == 0) {
            return;
        };

        var previousAtom = selectedObject;
        //var currentAtom = intersects[0].object;

        selectedObject = currentAtom;

        console.log("previously selected atom is", previousAtom);
        console.log("currently selected atom is", currentAtom);

        if (isDistanceMeasurementMode) { // if selectionMode is on to measure distance between atoms
            console.log("isDistanceMeasurementMode on");

            if (distanceMeasurementAtoms.length == 0) {
                console.log("only one atom so far");
                distanceMeasurementAtoms.push(currentAtom); // now the array has 1 atom in it
                return;
            } else if (distanceMeasurementAtoms.length == 1) {
                console.log("now two atoms");
                distanceMeasurementAtoms.push(currentAtom); // now the array has 2 atoms in it
                console.log(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1])

                drawLine(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]);
                var bond_para = document.createElement('p')
                //console.log(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]);
                bond_para.textContent = 'bond length: ' + calculateDistance(distanceMeasurementAtoms[0], distanceMeasurementAtoms[1]).toString();
                atomContent.appendChild(bond_para); 
            } else {
                console.log("too many atoms, cleared");
                distanceMeasurementAtoms = []; // clear array
                distanceMeasurementAtoms.push(currentAtom); // now the array has 1 atom in it
                return;
            };

        } else {
            if (!(previousAtom == null)) { // if there was a previously-selected object
                if (previousAtom == currentAtom) { // if previous selected object is the same as currently selected object
                    switchAtomState(currentAtom); // switch current atom's state
                    console.log("switched Atom State");
                    return;
                } else { // if clicking on a different atom
                    resetAtomState(previousAtom); // reset previously-clicked atom
                    switchAtomState(currentAtom); // switch current atom's state
                    console.log("wire framed new atom");
                    return;
                };
            } else { // if there was no previously-selected object
                switchAtomState(currentAtom); // switch current atom's state
                console.log("wire framed new atom");
                return;
            }            
        };  
    } else {
        console.log("doesn't intersect");
    };
} 


//get radius size of a given atom name 
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

    return rad; 
}