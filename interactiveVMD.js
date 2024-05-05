
//import three js and all the addons that are used in this script 
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//initialize the baseline objects  
let camera, scene, renderer, labelRenderer, container;
let controls;
let root;
let geometryAtoms, geometryBonds, json;
//let outlinePass, composer;
var raycaster, mouse = {x: 0, y: 0 }

const PDBloader = new PDBLoader();
const OBJloader = new OBJLoader();
const MTLloader = new MTLLoader(); 
const offset = new THREE.Vector3();

var selectedObject = null;
var mainColor = null; 
const atomContent = document.getElementsByClassName('atom-content')[0];

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
};

//setting default/on load molecule  
const mculeParams = {
    molecule: 'caffeine.pdb'
};

//setting default/on load representation   
const repParams = {
    representation: 'CPK',
};

//call everything! 
init();
animate();

//init function - sets up scene, camera, renderer, controls, and gui 
function init() {
    
    //initialize main window 
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    //gives the user a specific viewpoint of the scene 
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.z = 1000;
    scene.add( camera );

    //object needs to be illuminated to be visible 
    var ambientLight = new THREE.AmbientLight ( 0xffffff, 1)
    scene.add( ambientLight )

    const light1 = new THREE.DirectionalLight( 0xffffff, 2.5 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light2.position.set(  1, - 1, -1 );
    scene.add( light2 );

    //root contains all the objects of the scene 
    root = new THREE.Group();
    scene.add( root );

    //renderer makes scene visible 
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);

    //place the scene in the column middle window 
    container = document.getElementsByClassName('column middle')[0];
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

    //allow user to move around the molecule 
    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 100;
    controls.maxDistance = 3000;

    //the default/first molecule to show up 
    loadMolecule( mculeParams.molecule, 'CPK');

    //dynamic screen size 
    window.addEventListener( 'resize', onWindowResize );

    //container to hold the gui + location 
    const moleculeGUIContainer = document.createElement('div');
    moleculeGUIContainer.className = 'three-gui';
    document.getElementsByClassName( 'column left' )[0].appendChild(moleculeGUIContainer);
    
    //menus for the gui -- molecule & representation 
    const moleculeGUI = new GUI({ autoPlace: false }); 
    const molMenu = moleculeGUI.add(mculeParams, 'molecule', MOLECULES);
    const repMenu = moleculeGUI.add(repParams, 'representation', ['CPK', 'VDW', 'lines']);

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
                loadMolecule(mculeParams.molecule, 'lines');
                break;
            default:
                break;
        }
    });

    //when molecule changes, selected representation stays the same 
    molMenu.onChange(function(value) {
        loadMolecule(mculeParams.molecule, repParams.representation);
    });

    //add our gui to its container home 
    moleculeGUIContainer.appendChild(moleculeGUI.domElement);
}

//from the given pdb and given representation style, load molecule into scene 
function loadMolecule( model, rep ) {

    //grab model file 
    const url = '/models/molecules/' + model;
    
    //initialize geometries that will change based on representation 
    let boxGeometry, sphereGeometry; 

    //reset the scene because something new is being loaded 
    while ( root.children.length > 0 ) {
        const object = root.children[ 0 ];
        object.parent.remove( object );
    }

    //load by the pdb file 
    PDBloader.load( url, function ( pdb ) {
        //properties of pdb loader that isolate the atoms (& bonds if applicable to pdb) 
        geometryAtoms = pdb.geometryAtoms;
        geometryBonds = pdb.geometryBonds;
        json = pdb.json;

        //change starting box/sphere contents based on rep style 
        if( rep == 'CPK' ){
            //thin bonds, consistently sized atoms 
            boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
            sphereGeometry = new THREE.IcosahedronGeometry(1, 3 ); //radius 
        }
        
        if( rep == 'lines' ){
            //slightly thicker bonds for visibility, no atoms 
            boxGeometry = new THREE.BoxGeometry( 3, 3, 1 );
            sphereGeometry = new THREE.BoxGeometry(.5, .5, .5); //radius 
        }

            //vdw is set up later 

        //starting setup to put atoms into scene 
        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate();
        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );

        //grab atom content from pdb so their position and color go along 
        let positions = geometryAtoms.getAttribute( 'position' );
        const colors = geometryAtoms.getAttribute( 'color' );
        const position = new THREE.Vector3();
        var color = new THREE.Color(0xffffff);

        //LOAD IN ATOMS 
        for ( let i = 0; i < positions.count; i ++ ) {

            //loop through the positions array to get every atom 
            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );

            const material = new THREE.MeshPhongMaterial();

            //sphere visuals if VDW 
            if( rep == 'VDW' ){
                //radius depends on atom and is scaled up for viewing 
                const rad = getRadius(json.atoms[i][4])*2
                sphereGeometry = new THREE.IcosahedronGeometry(rad, 3 ); //radius 
            } 
            
            //create atom object that is a sphere w the position, color, and content we want 
            const object = new THREE.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 );
            object.scale.multiplyScalar( 25 );

            if( !(rep == 'lines') ){
                //all white for lines model so atoms blend in 
                object.material.color.set(color);
            } 
            
            // reference to original pdb within object for raycaster 
            object.atomValue = i; 

            //add atom object to scene 
            root.add( object );
        }

        //setup for bond loading 
        positions = geometryBonds.getAttribute( 'position' );
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        //LOAD IN BONDS 
        if(positions.count > 0){ //if bonds are known in pdb 
            for ( let i = 0; i < positions.count; i += 2 ) {
                
                //get bond start & end locations 
                start.x = positions.getX( i );
                start.y = positions.getY( i );
                start.z = positions.getZ( i );
    
                end.x = positions.getX( i + 1 );
                end.y = positions.getY( i + 1 );
                end.z = positions.getZ( i + 1 );
    
                start.multiplyScalar( 75 );
                end.multiplyScalar( 75 );
    
                //make bond a rectangular prism & add it to scene 
                const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
                object.position.copy( start );
                object.position.lerp( end, 0.5 );
                object.scale.set( 5, 5, start.distanceTo( end ) );
                object.lookAt( end );
                root.add( object );
            }
        }
        else { //if bonds aren't known in pdb 
            
            //loop through every atom and compare it to every following atom 
            //ex. 1 vs 2,3,4; 2 vs 3,4 
            for ( let i = 0; i < json.atoms.length-1; i += 1 ) {
                var atom1 = json.atoms[i][4]; 

                for ( let j = i+1; j < json.atoms.length; j += 1 ) {
                    //getting the content of atom 1 and atom 2 
                    var atom2 = json.atoms[j][4]; 

                    start.x = json.atoms[i][0]; 
                    start.y = json.atoms[i][1]; 
                    start.z = json.atoms[i][2]; 
        
                    end.x = json.atoms[j][0]; 
                    end.y = json.atoms[j][1]; 
                    end.z = json.atoms[j][2]; 

                    //so we can get the distance between them and see if that distance 
                    //matches the bond distance between their corresponding atom types (using isBond method -- later in code)
                    var dis = start.distanceTo(end); 
                    var isbond = isBond(atom1, atom2, dis);
                    
                    //if we have found a bond, then we add the geometry, same as above 
                    if(isbond){
                        positions = geometryAtoms.getAttribute( 'position' );
                        
                        start.x = positions.getX( i );
                        start.y = positions.getY( i );
                        start.z = positions.getZ( i );
            
                        end.x = positions.getX( j );
                        end.y = positions.getY( j );
                        end.z = positions.getZ( j );
                        
                        start.multiplyScalar( 75 );
                        end.multiplyScalar( 75 );
            
                        const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
                        object.position.copy( start );
                        object.position.lerp( end, 0.5 );
                        object.scale.set( 5, 5, start.distanceTo( end ) );
                        object.lookAt( end );
                        root.add( object );

                    }}}}
        
        //render the scene after adding all the new atom & bond objects             
        render();
    } );
}

//window resize function specific to container that this scene is in (not just entire window)
function onWindowResize() {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(containerWidth, containerHeight);
    render();
}

//animate the molecule (allow it to move, be clicked)
function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
    window.addEventListener('click', raycast);
}

//render the molecule (adding scene and camera + objects)
function render() {
    renderer.render( scene, camera );
}


//on click 
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

    //if so... 
     if (intersects.length > 0)
     {
        if (!(selectedObject == null) )
        {
            //reset prior object 
            selectedObject.material.color.set(mainColor); 
            selectedObject.material.wireframe = false;
            selectedObject.material.emissive.set(0x000000);
        }

        //if user is clicking the same object as before, leave it as reset to og settings 
        if (selectedObject == intersects[0].object){
            atomContent.innerHTML = 'selected atom: <br> none';
            return;
        }

        //otherwise, make this object visibly selected using wireframe        
        var val = intersects[0].object.atomValue;
        var selectedAtom = json.atoms[val];

        selectedObject = intersects[0].object; 
        mainColor = new THREE.Color('rgb(' + selectedAtom[ 3 ][ 0 ] + ',' + selectedAtom[ 3 ][ 1 ] + ',' + selectedAtom[ 3 ][ 2 ] + ')'); 

        selectedObject.material.wireframe = true;

        atomContent.innerHTML = 'selected atom: <br>' + selectedAtom[4][0];
       
    }
} 

//given names of two atoms and the distance between them, see if they are at the correct distance to be bonded 
function isBond(atom1, atom2, distance)
{
    var bond = false;
    var threshold = .07;

    var atomList = [atom1, atom2];
    atomList = atomList.sort();
    atom1 = atomList[0];
    atom2 = atomList[1];

    if(atom1 == "Br")
    {
        if(atom2 == "Br")
        {
            if(Math.abs(distance - 2.28) < threshold)
                { bond = true; }
        }

        if(atom2 == "H")
        {
            if(Math.abs(distance - 1.41) < threshold)
                { bond = true; }
        }
    } 

    if(atom1 == "C")
    {
        if(atom2 == "C")
        {
            if(Math.abs(distance - 1.54) < threshold)
            { bond = true; }

            if(Math.abs(distance - 1.39) < threshold)
            { bond = true; }

            if(Math.abs(distance - 1.34) < threshold)
            { bond = true; }

            if(Math.abs(distance - 1.20) < threshold)
            { bond = true; }
        }

        if(atom2 == "Cl")
        {
            if(Math.abs(distance - 1.77) < threshold)
                { bond = true; }
        }

        if(atom2 == "F")
        {
            if(Math.abs(distance - 1.33) < threshold)
                { bond = true; }
        }

        if(atom2 == "H")
        {
            if(Math.abs(distance - 1.10) < threshold)
                { bond = true; }
        }

        if(atom2 == "N")
        {
            if(Math.abs(distance - 1.47) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.38) < threshold)
                { bond = true; }  

            if(Math.abs(distance - 1.27) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.16) < threshold)
                { bond = true; }
        }    

        if(atom2 == "O")
        {
            if(Math.abs(distance - 1.43) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.23) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.13) < threshold)
                { bond = true; }
        }
    }

    if(atom1 == "Cl")
    {
        if(atom2 == "Cl")
        {
            if(Math.abs(distance - 2) < threshold)
                { bond = true; }
        }
        if(atom2 == "H")
        {
            if(Math.abs(distance - 1.27) < threshold)
                { bond = true; }
        }
    } 
    if(atom1 == 'F'){
        if(atom2 == "F")
        {
            if(Math.abs(distance - 1.43) < threshold)
                { bond = true; }
        }
        if(atom2 == "H")
        {
            if(Math.abs(distance - .92) < threshold)
                { bond = true; }
        }
    }

    if(atom1 == "H")
    {
        if(atom2 == "H")
        {
            if(Math.abs(distance - .75) < threshold)
                { bond = true; }
        }
        if(atom2 == "N")
        {
            if(Math.abs(distance - 1.04) < threshold)
                { bond = true; }
        }
        if(atom2 == "O")
        {
            if(Math.abs(distance - .96) < threshold)
                { bond = true; }
        }
        if(atom2 == "S")
        {
            if(Math.abs(distance - 1.34) < threshold)
                { bond = true; }
        }
    }

    if(atom1 == "N")
    {
        if(atom2 == "N")
        {
            if(Math.abs(distance - 1.47) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.38) < threshold)
                { bond = true; }
            
            if(Math.abs(distance - 1.24) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.10) < threshold)
                { bond = true; }
        }    

        if(atom2 == "O")
        {
            if(Math.abs(distance - 1.36) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.22) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.06) < threshold)
                { bond = true; }
        }
    }

    if(atom1 == "O")
    {
        if(atom2 == "O")
        {
            if(Math.abs(distance - 1.48) < threshold)
                { bond = true; }

            if(Math.abs(distance - 1.21) < threshold)
                { bond = true; }
        } 

        if(atom2 == "S")
        {
            if(Math.abs(distance - 1.43) < threshold)
                { bond = true; }
        } 
    }
    return bond; 
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