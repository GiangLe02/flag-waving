
import * as THREE from 'three';

import Stats from './three_r148/stats.module.js';
import { OrbitControls } from './three_r148/OrbitControls.js';

import{ WindyCloth } from './WindyCloth.js';

class Main {

    constructor() {
        
    }

    static init() {
        const wind_params = {
            DAMPING: 0.03,
            DRAG: 1 - 0.03, //1 - DAMPING
            MASS: 0.1,
            restDistance: 25,
            xSegs: 15,
            ySegs: 10,
            VELOCITY: 1000,
            windForce: new THREE.Vector3(0, 0, 0),
            tmpForce: new THREE.Vector3(),
            windEnabled: true,
            TIMESTEP: 0.000324, // (18 / 1000) * (18 / 1000)
            pinSide: 'left' // top. right, bottom or left
        };
        // console.log(speed);
        this.cloth = new WindyCloth(wind_params);
        this.speed = 1;
        this.container;
        this.stats;
        this.camera;
        this.scene;
        this.renderer;
        this.sphere;
        this.flagMesh;
        this.flagPoleMesh;
        this.flagPoleTopMesh;

        this.container = document.createElement('div');
        this.container.setAttribute('id', 'main_view');
        document.body.appendChild(this.container);

        const flagBackgroundInput = document.getElementById('flagBackground');
        flagBackgroundInput.addEventListener('change', this.handleFlagBackgroundChange.bind(this));

        const skyBackgroundInput = document.getElementById('skyBackground');
        skyBackgroundInput.addEventListener('change', this.handleSkyBackgroundChange.bind(this));

        const groundInput = document.getElementById('ground');
        groundInput.addEventListener('change', this.handleGroundTextureChange.bind(this));

       // scene
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x07074d);
     //   this.scene.fog = new THREE.Fog(0x4adf94, 50, 15000);
        const loader = new THREE.TextureLoader();
        
        const backgroundTexture = loader.load('textures/sky.webp');
        this.scene.background = backgroundTexture;

        // camera
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, -100, 3500);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // lights
        // DirectionalLight makes far better shadows than SpotLight
        const light = new THREE.DirectionalLight(0xffffff, 1);

        light.position.set(-250, 850, 1000);
        light.position.multiplyScalar(1.3);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;

        const d = 2000;

        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.camera.far = 4000;

        this.scene.add(light);

        // Nguồn sáng thứ hai
        const light2 = new THREE.SpotLight(0xdfebff, 1);
        light2.position.set(150, -550, -1000);
        light2.position.multiplyScalar(1.3);

        this.scene.add(light2);

        // START FLAG
        // cloth material


        const clothTexture = loader.load('textures/flagVN.webp');
        clothTexture.anisotropy = 16;

        const clothMaterial = new THREE.MeshPhongMaterial({
            map: clothTexture,
            side: THREE.DoubleSide,//hiển thị cả phía trước và phía sau
            alphaTest: 0,// loại bỏ các pixel có giá trị alpha thấp
        });
 

        // cloth mesh
        this.flagMesh = new THREE.Mesh(this.cloth.geometry, clothMaterial);
        this.flagMesh.position.set(0, 110, 0);
        this.flagMesh.castShadow = true;

        // gives it the light depth variations
        this.flagMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: clothTexture,
            alphaTest: 0
        });

        this.scene.add(this.flagMesh);
        // END FLAG

        // ground
        const groundTexture = loader.load('./textures/grasslight-big.jpg');

        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;//giúp texture lặp lại trên mặt đất
        groundTexture.repeat.set(25, 25);
        groundTexture.anisotropy = 16;
        groundTexture.encoding = THREE.sRGBEncoding;

        const groundMaterial = new THREE.MeshLambertMaterial({map: groundTexture});

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), groundMaterial);
        mesh.position.y = -250;
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        mesh.name = 'groundMesh';

        this.scene.add(mesh);

        // flag pole and parts
        // flag pole
        const reflectiveMat = new THREE.MeshStandardMaterial({color: 0xe5e6ff, roughness: 0.1, metalness: 1.0});
        // pole
        const poleGeo = new THREE.CylinderGeometry(10, 10, 750, 10);//hình trụ có bán kính đáy là 10, chiều cao là 750 và được chia thành 10 phần

        const flagPoleMesh = new THREE.Mesh(poleGeo, reflectiveMat);
        flagPoleMesh.position.x = -200;
        flagPoleMesh.position.y = 125;
        flagPoleMesh.receiveShadow = true;
        flagPoleMesh.castShadow = true;

        this.scene.add(flagPoleMesh);

        // round top
        const poleTopGeo = new THREE.SphereGeometry(15, 16, 16);// hình cầu với bán kính 15 và được chia thành 16 đoạn dọc và 16 đoạn ngang
        const flagPoleTopMesh = new THREE.Mesh(poleTopGeo, reflectiveMat);
        flagPoleTopMesh.position.x = -200;
        flagPoleTopMesh.position.y = 500;
        flagPoleTopMesh.receiveShadow = true;
        flagPoleTopMesh.castShadow = true;

        this.scene.add(flagPoleTopMesh);
        // end flag pole and parts

        // renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});// bật chế độ chống răng cưa
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Chế độ shadow mượt mà
        this.renderer.shadowMap.bias = -0.002; // Điều chỉnh shadow bias

        this.container.appendChild(this.renderer.domElement);

        // controls
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.maxPolarAngle = Math.PI;
        controls.minDistance = 1000;
        controls.maxDistance = 5000;

        // performance monitor
        this.stats = new Stats();
        this.stats.domElement.style.cssText = 'position:absolute;top:0px;right:0px;';

        this.container.appendChild(this.stats.dom);

        this.animate(0);
    }
    
        // Handle flag background change event
    static handleFlagBackgroundChange(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const flagBackgroundUrl = e.target.result;
                this.updateFlagBackgroundTexture(flagBackgroundUrl);
            };
            reader.readAsDataURL(file);
    }

    static handleSkyBackgroundChange(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const skyBackgroundUrl = e.target.result;
            this.updateSkyBackgroundTexture(skyBackgroundUrl);
        };
        reader.readAsDataURL(file);
    }
    
    static handleGroundTextureChange(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const groundTextureUrl = e.target.result;
            this.updateGroundTexture(groundTextureUrl);
        };
        reader.readAsDataURL(file);
    }
    
    static async updateFlagBackgroundTexture(url) {
        const loader = new THREE.TextureLoader();
        const flagBackgroundTexture = await loader.loadAsync(url);
        flagBackgroundTexture.wrapS = THREE.RepeatWrapping;
        flagBackgroundTexture.wrapT = THREE.RepeatWrapping;
        flagBackgroundTexture.repeat.set(1, 1);
        this.flagMesh.material.map = flagBackgroundTexture;
        this.flagMesh.material.needsUpdate = true;
    }
    
    static updateSkyBackgroundTexture(url) {
        const loader = new THREE.TextureLoader();
        const backgroundTexture = loader.load(url);
        this.scene.background = backgroundTexture;
        this.render();
    }
    
    static updateGroundTexture(url) {
        const loader = new THREE.TextureLoader();
        const groundTexture = loader.load(url);
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(25, 25);
        groundTexture.anisotropy = 16;
        groundTexture.encoding = THREE.sRGBEncoding;
    
        const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
        const groundMesh = this.scene.getObjectByName('groundMesh');
        groundMesh.material = groundMaterial;
    
        this.render();
    }
    
    static animate(now) {
        const speedRange = document.getElementById('speedRange');
        speedRange.addEventListener('input', () => {
            this.speed = parseFloat(speedRange.value) / 100;
        //    console.log(this.speed);
        });
        window.requestAnimationFrame(this.animate.bind(this));
        this.cloth.simulate(now, this.speed);
        this.render();
        this.stats.update();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initResizeListener() {
        window.addEventListener('resize', this.onWindowResize, false);
    }

    static render() {
        const p = this.cloth.particles;
        for (let i = 0, il = p.length; i < il; i++) {
            const v = p[ i ].position;
            this.cloth.geometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
        }
        this.cloth.geometry.attributes.position.needsUpdate = true;
        this.cloth.geometry.computeVertexNormals();
        this.renderer.render(this.scene, this.camera);
    }

}

export { Main };