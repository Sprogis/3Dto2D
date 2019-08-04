'use strict';
/* global THREE */


function bajsman() {
    const bajs = document.querySelector('#sheet');
    bajs.value = true;
}

function updateHTMLValues(id, value){
    document.querySelector('#'+id).value = value;
}

function main(){
    let bajs = false;
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas, preserveDrawingBuffer: true, alpha: true});
    renderer.setClearColor( 0x000000, 0 );
    const fov = 60;
    const aspect = 2;
    const near = 0.1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = -100;
    const scene = new THREE.Scene();
    //scene.background = new THREE.Color('white');
    const materialId = [];
    const colors = [];
    var mixer;
    let model;
    let animations;
    let activeAction;
    let modeldir = '/uploads/' + document.cookie + '/scene.gltf';

    function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
        const halfFovY = THREE.Math.degToRad(camera.fov * .5);
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
        // compute a unit vector that points in the direction the camera is now
        // in the xz plane from the center of the box
        const direction = (new THREE.Vector3())
            .subVectors(camera.position, boxCenter)
            .multiply(new THREE.Vector3(1, 0, 1))
            .normalize();
    
        // move the camera to a position distance units way from the center
        // in whatever direction the camera was from the center already
        camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    
        // pick some near and far values for the frustum that
        // will contain the box.
        camera.near = boxSize / 100;
        camera.far = boxSize * 100;
    
        camera.updateProjectionMatrix();
    
        // point the camera to look at the center of the box
        camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
    }

    
    var setMaterialViewer = function(names, colors){
        var table = document.getElementById("tableboy");

        for(var i = 0; i < names.length; ++i){
            if(model && !model.getObjectById(names[i].id).material.map){
                var entry = document.createElement("tr");
                var name = document.createElement("td");
                table.appendChild(entry);
                entry.appendChild(name);
                var bruh = document.createTextNode(names[i].name);
                name.appendChild(bruh);
                var color = document.createElement("td");
                var colorPicker = document.createElement("input");
                colorPicker.id = "color"+i;
                colorPicker.type = "color";
                colorPicker.value = '#'+colors[i].getHexString();
                
                entry.appendChild(color);
                color.appendChild(colorPicker)
            }
        }
    }
    function setUpRadios(){
        const form = document.querySelector('#anim');
        for(var i = 0; i < animations.length; ++i){
            const label = document.createElement('label');
            label.htmlFor = animations[i].name;
            const text = document.createTextNode(animations[i].name);
            label.appendChild(text);

            const input = document.createElement('input');
            input.type = "radio";
            input.name = "animation";
            input.id = animations[i].name;
            input.value = i;
            form.appendChild(input);
            form.appendChild(label);

        }
    }

    {
        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load(modeldir, (gltf) => {
            
            const root = gltf.scene;

            scene.add(root);
            let intensit = 1;
            root.traverse(function (node) {

                if (node.isSkinnedMesh | node.isMesh){

                    const mater = node.material;
                
                    if(mater.map){
                        intensit = 2.5;
                    }

                    if(mater.isMeshBasicMaterial){
                        node.material = new THREE.MeshStandardMaterial({color : mater.color, map: mater.map,
                            name: mater.name, 
                            metalness: 0,
                            roughness: 0,
                            fog: false,
                            refractionRatio: 0,
                            needsUpdate: true,
                            skinning: mater.skinning
                        });

                    }

                    colors.push(node.material.color);
                    materialId.push({id: node.id, name: node.name}); 
                }
              });
                
            var light = new THREE.AmbientLight( 0xFFFFFF, intensit); // soft white light
            scene.add( light );
      
            model = root;
            //console.log(root);
            animations = gltf.animations;
            
            setUpRadios();
            mixer = new THREE.AnimationMixer( root );

            setMaterialViewer(materialId, colors);
            // compute the box that contains all the stuff
            // from root and below


            const box = new THREE.Box3().setFromObject(root);

            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());

            // set the camera to frame the box
            frameArea(boxSize, boxSize, boxCenter, camera);
        }, 	function ( xhr ) {

            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
        },
        // called when loading has errors
        function ( error ) {
    
            console.log('Waiting for a model');
    
        });
    }
    
    function move(object){
        const x = document.querySelector('#rx').value*Math.PI/180;
        const y = document.querySelector('#ry').value*Math.PI/180;
        const z = document.querySelector('#rz').value*Math.PI/180;
        
        object.setRotationFromEuler(new THREE.Euler( x, y, z, 'XYZ' ));
        
        const scale = document.querySelector('#scale').value;
        object.scale.set(scale, scale, scale);
        
        const dx = document.querySelector('#dx').value;
        const dy = document.querySelector('#dy').value;
        object.position.set(dx*10, dy*10, 0);
    }

    function updateColors(){
        let currColor;
        for(let i = 0; i < colors.length; ++i){
            if(model & !model.getObjectById(materialId[i].id).material.map)
            currColor = document.querySelector('#color'+i).value;
            colors[i].set(currColor);
        }
    }

    var value = -1;

    function animator(){
        const option = document.getElementsByName("animation")
        
        for(var i = 0; i < option.length; i++){
            if(option[i].checked){
                if(value != i-1){
                    if(activeAction){
                        activeAction.stop();
                    }       
                }
                value = option[i].value;
            }
        }
    
        if(value == "-1"){
            if(activeAction){
                activeAction.stop();
                var foo = document.querySelector('#tempCanvas');
                if(foo){
                    document.body.removeChild(foo);
                }
            }
        }
        else{
            activeAction = mixer.clipAction( animations[value] );
            activeAction.play();
        }
    }

    let arr = [];
    let arr2 = [];

    function makeSpriteSheet(){
        if(activeAction){
            const mat = new THREE.MeshNormalMaterial();
            mat.skinning = true;
            const temp = [];
                          
            let keyframes = activeAction.getClip().tracks[0].times;
            for(let i = 1; i < activeAction.getClip().tracks.length; i++){
                
                if(activeAction.getClip().tracks[i].times.length > keyframes.length){
                    keyframes = activeAction.getClip().tracks[i].times;
                }
            }

            activeAction.stop();
            mixer.time = 0;

             for(let i = 0; i < keyframes.length; i++){

                mixer.update(keyframes[i]);
                activeAction.time = keyframes[i];
                activeAction.play();
                renderer.render(scene, camera);
                arr.push(renderer.domElement.toDataURL());
             }

            //Change to NormalMap
            for(let i = 0; i < materialId.length; i++){           
                let mesh = scene.getObjectById(materialId[i].id);
                temp[i] = mesh.material;
                mesh.material = mat;
            }

            activeAction.stop();
            mixer.time = keyframes[0];

            for(let i = 0; i < keyframes.length; i++){

                mixer.update(keyframes[i]);
                activeAction.time = keyframes[i];
                activeAction.play();
                renderer.render(scene, camera);
                arr2.push(renderer.domElement.toDataURL());
             }

            //Change to Back to Color Mat
            for(let i = 0; i < materialId.length; i++){           
                let mesh = scene.getObjectById(materialId[i].id);
                mesh.material = temp[i];
            }
        }

    }

    function drawOnCanvas(arr, normal){
        var foo = document.querySelector('#tempCanvas');
        if(foo){
            document.body.removeChild(foo);
        }
        var canvas2 = document.createElement("canvas");
        canvas2.width = canvas.width*4;
        canvas2.height = canvas.height*Math.ceil(arr.length/4);
        canvas2.id = "tempCanvas" + normal;
        canvas2.style = `image-rendering: optimizeSpeed;
            image-rendering: -moz-crisp-edges;
            image-rendering: -o-crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            -ms-interpolation-mode: nearest-neighbor;
            image-rendering: pixelated;
            image-rendering: optimize-contrast;`
        var ctx = canvas2.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for(let i = 0; i < arr.length; i++){
            let foo = new Image();
            foo.src = arr[i];
            
            foo.onload = function(){
                ctx.drawImage(foo, (i%4)*canvas.width, Math.floor(i/4)*canvas.height);
                if(i == arr.length-1){
                    
                    const sheet = canvas2.toDataURL();
                    var image = new Image();
                    image.src = sheet;
                    image.onload = function(){
                        const w = window.open(image.src);
                        w.document.write(image.outerHTML);
                    }
                    document.body.removeChild(document.querySelector('#tempCanvas'+normal));
                }
            }

        }

        document.body.appendChild(canvas2);
        

    }

    let then = 0;
    function render(time){
        bajs = document.querySelector('#sheet').value;
        document.querySelector('#sheet').value = false;
        time *= 0.001;
        const delta = time - then;
        then = time;
        if(model){
            move(model);
            updateColors();
            mixer.update( delta );
            animator();
            if(value != -1 && bajs=="true" && activeAction){
                arr = [];
                arr2 = [];
                makeSpriteSheet();
                if(arr.length > 0){
                    drawOnCanvas(arr, false);
                    drawOnCanvas(arr2, true);
                    bajs = false;
                }
            }
            else{
                bajs = false;
            }
            
        }

        const canvas = renderer.domElement;
        canvas.width = document.querySelector('#width').value;
        canvas.height = document.querySelector('#height').value;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setViewport(0, 0, canvas.width, canvas.height);
        if(model){
            renderer.render(scene, camera);
        }
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();