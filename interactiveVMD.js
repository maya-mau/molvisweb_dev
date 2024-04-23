
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 

let camera, scene, renderer, labelRenderer, container;
let controls;
let root;
let geometryAtoms, geometryBonds, json;
let outlinePass, composer;

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
    'ABL Kinase': 'Ablkinase.pdb',

    // pulldown for pdb 
    // edpuzzle 
    // scott anderson 
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

window.addEventListener('load', function() {
    init();
    animate();

});


function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    // orthographic camera 
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
    renderer.setPixelRatio(window.devicePixelRatio);

    container = document.getElementsByClassName('column middle')[0];
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

    /*outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.visibleEdgeColor.set( 0x000000 );
    composer = new EffectComposer( renderer );
    composer.addPass( outlinePass ); */ 

    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 10;
    controls.maxDistance = 20000;

    //call method 
    loadMolecule( mculeParams.molecule );

    window.addEventListener( 'resize', onWindowResize );


    const moleculeGUIContainer = document.createElement('div');
    moleculeGUIContainer.className = 'three-gui';

    document.getElementsByClassName( 'column left' )[0].appendChild(moleculeGUIContainer);
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
        // remove atoms for line model -- thicken lines for ribbno (?) model, scale sphere for VDW 
        for ( let i = 0; i < positions.count; i ++ ) {

            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );

            const material = new THREE.MeshPhongMaterial();

            const object = new THREE.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 );
            object.scale.multiplyScalar( 25 );
            object.material.color.set(color);

            object.atomValue = i;
            root.add( object );

            //can i add a property to the sphere that is the corresponding pdb number? can i make the json accessible from the other functions? 

            const atom = json.atoms[ i ];
        }

        //BONDS 
        positions = geometryBonds.getAttribute( 'position' );

        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        if(positions.count > 0){
            for ( let i = 0; i < positions.count; i += 2 ) {

                start.x = positions.getX( i );
                start.y = positions.getY( i );
                start.z = positions.getZ( i );
    
                end.x = positions.getX( i + 1 );
                end.y = positions.getY( i + 1 );
                end.z = positions.getZ( i + 1 );
    
                start.multiplyScalar( 75 );
                end.multiplyScalar( 75 );
    
                const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
                object.position.copy( start );
                object.position.lerp( end, 0.5 );
                object.scale.set( 5, 5, start.distanceTo( end ) );
                object.lookAt( end );
                root.add( object );
            }
        }
        else {
            for ( let i = 0; i < json.atoms.length-1; i += 1 ) {
                
                var atom1 = json.atoms[i][4]; 

                for ( let j = i+1; j < json.atoms.length; j += 1 ) {
                    
                    var atom2 = json.atoms[j][4]; 

                    start.x = json.atoms[i][0]; 
                    start.y = json.atoms[i][1]; 
                    start.z = json.atoms[i][2]; 
        
                    end.x = json.atoms[j][0]; 
                    end.y = json.atoms[j][1]; 
                    end.z = json.atoms[j][2]; 

                    var dis = start.distanceTo(end); 
                    var isbond = isBond(atom1, atom2, dis);
                                                        
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
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(containerWidth, containerHeight);
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
}

function raycast(event)
{
    var rect = renderer.domElement.getBoundingClientRect();
    var containerRect = container.getBoundingClientRect(); // Get container's bounding rectangle
    mouse.x = ((event.clientX - rect.left) / containerRect.width) * 2 - 1; // Adjust for container's width
    mouse.y = -((event.clientY - rect.top) / containerRect.height) * 2 + 1; // Adjust for container's height
    
    raycaster.setFromCamera( mouse, camera );  
    var intersects = raycaster.intersectObjects( scene.children );

    //ask chat for why double click 
     if (intersects.length > 0)
     {
        var val = intersects[0].object.atomValue;
        var selectedAtom = json.atoms[val];
        var origColor = new THREE.Color('rgb(' + selectedAtom[ 3 ][ 0 ] + ',' + selectedAtom[ 3 ][ 1 ] + ',' + selectedAtom[ 3 ][ 2 ] + ')'); 

        //outlinePass.selectedObjects = intersects[0];

        console.log(selectedAtom[ 4 ][ 0 ])

        //will this need to hold if only one st a time
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