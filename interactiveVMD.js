
import * as THREE from 'three';

import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, labelRenderer, container;
let controls;
let root;
let geometryAtoms, geometryBonds, json;

const pointer = new THREE.Vector2();
var raycaster, mouse = {x: 0, y: 0 }
raycaster = new THREE.Raycaster();

raycaster.near = .1;
raycaster.far = Infinity;
raycaster.params.Points.threshold = 0.1; // Adjust as needed
raycaster.params.Line.threshold = 0.1;   // Adjust as needed
//window.addEventListener('pointerdown',raycast,false);

//properties -- per atom radius and bond length 

const MOLECULES = {
    'Ponatinib': 'ponatinib_Sep2022.pdb',
    'Caffeine': 'caffeine.pdb',
};

//default 
const mculeParams = {
    molecule: 'caffeine.pdb'
};

const REPRESENTATIONS = {
    'lines': 'linescene',
    'VDWs': 'scene',
};

const repParams = {
    representation: 'scene',
};

const PDBloader = new PDBLoader();
const OBJloader = new OBJLoader();
const MTLloader = new MTLLoader(); 
const offset = new THREE.Vector3();

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.z = 1000;
    scene.add( camera );

    var ambientLight = new THREE.AmbientLight ( 0xffffff, 1)
    scene.add( ambientLight )

    const light1 = new THREE.DirectionalLight( 0xffffff, 2.5 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light2.position.set(  1, - 1, -1 );
    scene.add( light2 );

    root = new THREE.Group();
    scene.add( root );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    //renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setSize(containerWidth, containerHeight);
    //document.getElementsByClassName( 'column middle' )[0].appendChild( renderer.domElement );

    renderer.setPixelRatio(window.devicePixelRatio);


    container = document.getElementsByClassName('column middle')[0];
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    renderer.setSize(containerWidth, containerHeight);


    //renderer.setSize( window.innerWidth, window.innerHeight );


    container.appendChild(renderer.domElement);

    
    /*
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById( 'container' ).appendChild( labelRenderer.domElement ); */

    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 500;
    controls.maxDistance = 2000;

    //call method 
    loadMolecule( mculeParams.molecule );

    window.addEventListener( 'resize', onWindowResize );

    const moleculeGUIContainer = document.createElement('div');
    document.getElementsByClassName( 'column side' )[0].appendChild(moleculeGUIContainer);
    const moleculeGUI = new GUI({ autoPlace: false }); // Disable auto-placement
    moleculeGUI.add(mculeParams, 'molecule', MOLECULES).onChange(loadMolecule);
    moleculeGUI.add(repParams, 'representation', REPRESENTATIONS).onChange(loadRepresentation);
    moleculeGUIContainer.appendChild(moleculeGUI.domElement);

}

function loadMolecule( model ) {

    const url = '/models/molecules/' + model;

    while ( root.children.length > 0 ) {
        const object = root.children[ 0 ];
        object.parent.remove( object );
    }

    PDBloader.load( url, function ( pdb ) {

        geometryAtoms = pdb.geometryAtoms;
        geometryBonds = pdb.geometryBonds;
        json = pdb.json;

        const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
        const sphereGeometry = new THREE.IcosahedronGeometry(1, 3 ); //radius 

        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate();

        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );

        let positions = geometryAtoms.getAttribute( 'position' );
        const colors = geometryAtoms.getAttribute( 'color' );

        const position = new THREE.Vector3();
        const color = new THREE.Color();

        //ATOMS 
        for ( let i = 0; i < positions.count; i ++ ) {

            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );

            const material = new THREE.MeshPhongMaterial( { color: color } );

            const object = new THREE.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 );
            object.scale.multiplyScalar( 25 );

            object.atomValue = i;
            root.add( object );

            //can i add a property to the sphere that is the corresponding pdb number? can i make the json accessible from the other functions? 

            const atom = json.atoms[ i ];

            /*
            const text = document.createElement( 'div' );
            text.className = 'label';
            text.style.color = 'rgb(' + atom[ 3 ][ 0 ] + ',' + atom[ 3 ][ 1 ] + ',' + atom[ 3 ][ 2 ] + ')';
            text.textContent = atom[ 4 ];

            const label = new CSS2DObject( text );
            label.position.copy( object.position );
            root.add( label ); */

        }

        //BONDS 
        positions = geometryBonds.getAttribute( 'position' );

        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        //var atom1 = json.atoms[i][4]; 
        //var atom2 = json.atoms[i+1][4]; 

        for ( let i = 0; i < positions.count; i += 2 ) {

            start.x = positions.getX( i );
            start.y = positions.getY( i );
            start.z = positions.getZ( i );

            end.x = positions.getX( i + 1 );
            end.y = positions.getY( i + 1 );
            end.z = positions.getZ( i + 1 );

            //console.log(positions)
            //console.log(start.distanceTo(end))

            start.multiplyScalar( 75 );
            end.multiplyScalar( 75 );

            const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
            object.position.copy( start );
            object.position.lerp( end, 0.5 );
            object.scale.set( 5, 5, start.distanceTo( end ) );
            object.lookAt( end );
            root.add( object );

        }
        render();
    } );

}

function loadRepresentation( model ) {

    const url = 'models/representations/' + model;

    while ( root.children.length > 0 ) {
        const object = root.children[ 0 ];
        object.parent.remove( object );
    }

    MTLloader.load(url + '.mtl', function(materials) {
        materials.preload();
        OBJloader.setMaterials(materials);
    
        OBJloader.load(url + '.obj', function(object) {
            let boundingBox = new THREE.Box3().setFromObject(object)
            let measure = new THREE.Vector3();
            let size = boundingBox.getSize(measure); // HEREyou get the size
            console.log(size);

            object.position.multiplyScalar(75);
            object.scale.multiplyScalar(size.x * 100 + size.y * 100 + size.z * 100);
    
            root.add(object);
            render();
        });

        //aaaany possibility of orienting the axes to be the same??? 
        //should i be more constant in how i download from vmd? 
    });

}

//

function onWindowResize() {
        // Get the new width and height of the container
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Update the renderer's size to match the new container dimensions
    renderer.setSize(containerWidth, containerHeight);

    // Update the camera aspect ratio
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    
        // Render the scene
    
    //labelRenderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
    window.addEventListener('click', raycast);
}

function render() {
    renderer.render( scene, camera );
    //labelRenderer.render( scene, camera );
}

function raycast(event)
{
    var rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
	mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
    
    //set ray origin 
    raycaster.setFromCamera( mouse, camera );  
    
    //find intersecting objects
    var intersects = raycaster.intersectObjects( scene.children );

    //ask chat for why double click 
     if (intersects.length > 0)
     {
        var val = intersects[0].object.atomValue;
        var selectedAtom = json.atoms[val];
        var origColor = new THREE.Color('rgb(' + selectedAtom[ 3 ][ 0 ] + ',' + selectedAtom[ 3 ][ 1 ] + ',' + selectedAtom[ 3 ][ 2 ] + ')'); 

        if(intersects[0].object.material.color.equals(origColor)) 
        {
            intersects[0].object.material.color.set(0xFFC0CB);
        }
        else 
        {
            intersects[0].object.material.color.set(origColor); 
        }        	
	}
}

function isBond(atom1, atom2, distance)
{
    var bond = false;
    var threshold = 5;

    var atomList = [atom1, atom2];
    atomList = atomList.sort();
    atom1 = atomList[0];
    atom2 = atomList[1];

    if(atom1.equals("C"))
    {
        if(atom2.equals("C"))
        {
            if(Math.abs(distance - 154) < threshold)
            { bond = true; }

            if(Math.abs(distance - 134) < threshold)
            { bond = true; }

            if(Math.abs(distance - 120) < threshold)
            { bond = true; }
        }

        if(atom2.equals("N"))
        {
            if(Math.abs(distance - 147) < threshold)
                { bond = true; }

            if(Math.abs(distance - 127) < threshold)
                { bond = true; }

            if(Math.abs(distance - 116) < threshold)
                { bond = true; }
        }    

        if(atom2.equals("O"))
        {
            if(Math.abs(distance - 143) < threshold)
                { bond = true; }

            if(Math.abs(distance - 123) < threshold)
                { bond = true; }

            if(Math.abs(distance - 113) < threshold)
                { bond = true; }
        }

        if(atom2.equals("H"))
        {
            if(Math.abs(distance - 110) < threshold)
                { bond = true; }
        }

        if(atom2.equals("F"))
        {
            if(Math.abs(distance - 133) < threshold)
                { bond = true; }
        }

        if(atom2.equals("Cl"))
        {
            if(Math.abs(distance - 177) < threshold)
                { bond = true; }
        }

    }

    if(atom1.equals("N"))
    {

    }

    if(atom1.equals("O"))
    {

    }

    if(atom1.equals("S"))
    {

    }

    if(atom1.equals("H"))
    {

    }
}

// can i imbed vmd ribbon / other visualizations as the like blender files? 
// /programs/common enumerate within distance bond tolerance .05/.1 from atom type chonspf nested for 
