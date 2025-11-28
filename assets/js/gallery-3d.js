import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const paintings = [];

// === 参数 ===
const IMG_COUNT = 12; 
const TOTAL_PAINTINGS = 50; 
const SPACING = 25; 
const ROWS_PER_LOOP = Math.ceil(TOTAL_PAINTINGS / 2); 
const LOOP_DISTANCE = ROWS_PER_LOOP * SPACING; 
const HALL_WIDTH = 50; 
// 修改点1：大幅增加展厅高度，更显宏伟
const HALL_HEIGHT = 45; 

let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0; let touchStartY = 0;

init();
animate();

function init() {
    scene = new THREE.Scene();
    
    const fogColor = 0xffeadd; 
    scene.background = new THREE.Color(fogColor); 
    // 雾气稍微调淡一点点，让高处能看清
    scene.fog = new THREE.FogExp2(fogColor, 0.006);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    // 相机视点稍微抬高一点点
    camera.position.set(0, 11, 30); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; // 稍微调亮一点曝光
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // === 灯光系统 ===
    const ambientLight = new THREE.AmbientLight(0xffdcb4, 0.8); 
    scene.add(ambientLight);

    // 太阳光增强一点，位置提高
    const sunLight = new THREE.DirectionalLight(0xffaa77, 1.8); 
    sunLight.position.set(-40, 80, 60); // 提高光源位置适应高墙
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -150; sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150; sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.mapSize.width = 4096; sunLight.shadow.mapSize.height = 4096; // 提高阴影质量
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    buildEndlessHall();

    // === 挂画循环逻辑 ===
    const leftX = -HALL_WIDTH/2 + 0.5;
    const rightX = HALL_WIDTH/2 - 0.5;
    const BUFFER_ROWS = 8; 

    // 修改点2：画作挂载高度 Y 从 9 提升到 18
    const ART_Y_POS = 18; 

    for (let i = -BUFFER_ROWS; i < ROWS_PER_LOOP + BUFFER_ROWS; i++) {
        let normalizedRowIndex = (i % ROWS_PER_LOOP + ROWS_PER_LOOP) % ROWS_PER_LOOP;
        let leftImgIdx = (normalizedRowIndex * 2) % IMG_COUNT; 
        let rightImgIdx = (normalizedRowIndex * 2 + 1) % IMG_COUNT;
        const zPos = -i * SPACING;

        let leftArtNum = (normalizedRowIndex * 2) + 1; 
        let leftImgPath = `assets/images/gallery/eg${leftImgIdx + 1}.jpg`;
        // 稍微增大一点画作尺寸
        let lW = 14 + (leftImgIdx % 3) * 2; let lH = 14 + (leftImgIdx % 2) * 5;
        
        addChineseArt(leftImgPath, lW, lH, leftX, ART_Y_POS, zPos, Math.PI/2, 
            `作品 No.${leftArtNum}`, "Yanxu系列", `系列作品 ${leftArtNum}/50`);

        let rightArtNum = (normalizedRowIndex * 2) + 2;
        let rightImgPath = `assets/images/gallery/eg${rightImgIdx + 1}.jpg`;
        let rW = 14 + (rightImgIdx % 3) * 2; let rH = 14 + (rightImgIdx % 2) * 5;

        addChineseArt(rightImgPath, rW, rH, rightX, ART_Y_POS, zPos, -Math.PI/2, 
            `作品 No.${rightArtNum}`, "Yanxu系列", `系列作品 ${rightArtNum}/50`);
    }

    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造结构 ===
function buildEndlessHall() {
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, 2000);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0xe3d2c0, roughness: 0.6, metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true; 
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xfff8ed, roughness: 0.9
    });
    // 墙壁高度适应新的 HALL_HEIGHT
    const wallGeo = new THREE.PlaneGeometry(2000, HALL_HEIGHT);
    
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-HALL_WIDTH/2, HALL_HEIGHT/2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(HALL_WIDTH/2, HALL_HEIGHT/2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x8c7662, roughness:0.8 });
    const skirtGeo = new THREE.BoxGeometry(0.2, 1.2, 2000); // 踢脚线稍微高一点点
    const s1 = new THREE.Mesh(skirtGeo, skirtMat); s1.position.set(-HALL_WIDTH/2 + 0.1, 0.6, 0); s1.receiveShadow=true; scene.add(s1);
    const s2 = new THREE.Mesh(skirtGeo, skirtMat); s2.position.set(HALL_WIDTH/2 - 0.1, 0.6, 0); s2.receiveShadow=true; scene.add(s2);
}

function addChineseArt(url, w, h, x, y, z, ry, title, subtitle, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    const frameGeo = new THREE.BoxGeometry(w + 2.5, h + 2.5, 0.5); // 框稍微厚一点
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d291e, roughness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true; 
    group.add(frame);

    const mountGeo = new THREE.PlaneGeometry(w + 1.8, h + 1.8);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xfdfaf5, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = 0.26;
    group.add(mount);

    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = 0.27;
    
    canvas.userData = { 
        url: url, title: title, subtitle: subtitle, desc: desc,
        longDesc: "这是一段关于这幅画作的详细介绍占位符。清晨温暖的阳光穿透长廊，洒落在水墨之间，笔触的干湿浓淡在金色的光辉中更显层次。艺术家通过对传统技法的现代诠释，表达了对自然与心境的独特感悟。这里可以写很长很长，测试一下它是否会溢出玻璃框。应该不会了。" 
    };
    paintings.push(canvas); 
    group.add(canvas);

    // 射灯位置也相应提高
    const spotLight = new THREE.SpotLight(0xffe0b0, 60); 
    spotLight.position.set(0, y + 8, 10); // 相对画作位置提高
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.6; 
    spotLight.distance = 40;
    group.add(spotLight);
    group.add(spotLight.target);

    scene.add(group);
}

function onMouseClick(event) {
    if (controls.isLocked || isMobile) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(paintings);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;
            showDetailModal(data);
            if(!isMobile) controls.unlock();
        }
    }
}

function showDetailModal(data) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-img').src = data.url;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-subtitle').innerText = data.subtitle + " · " + data.desc;
    document.getElementById('modal-long-desc').innerText = data.longDesc;
    
    let seed = 0;
    for (let i = 0; i < data.title.length; i++) { seed += data.title.charCodeAt(i); }
    const views = (seed * 12345) % 49000 + 1000;
    document.getElementById('view-count').innerText = views.toLocaleString();

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function setupControls() {
    const blocker = document.getElementById('blocker');
    if (!isMobile) {
        controls = new PointerLockControls(camera, document.body);
        blocker.addEventListener('click', () => controls.lock());
        controls.addEventListener('lock', () => { blocker.style.opacity=0; setTimeout(()=>blocker.style.display='none',600); });
        controls.addEventListener('unlock', () => { 
            if(document.getElementById('detail-modal').style.display !== 'flex') {
                blocker.style.display='flex'; setTimeout(()=>blocker.style.opacity=1,10);
            }
        });
        scene.add(controls.getObject());
        const onKey = (e, isDown) => {
            switch(e.code){ case 'KeyW':moveForward=isDown;break; case 'KeyA':moveLeft=isDown;break; case 'KeyS':moveBackward=isDown;break; case 'KeyD':moveRight=isDown;break; }
        };
        document.addEventListener('keydown', (e)=>onKey(e,true));
        document.addEventListener('keyup', (e)=>onKey(e,false));
    } else {
        blocker.addEventListener('click', () => { blocker.style.opacity=0; setTimeout(()=>blocker.style.display='none',600); });
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX; touchStartY = e.touches[0].pageY;
            if(e.touches[0].pageY < window.innerHeight/2) moveForward = true; else moveBackward = true;
        }, {passive:false});
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const deltaX = (e.touches[0].pageX - touchStartX) * 0.005;
            camera.rotation.y -= deltaX;
            touchStartX = e.touches[0].pageX;
        }, {passive:false});
        document.addEventListener('touchend', () => { moveForward=false; moveBackward=false; });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1); 

    if (controls?.isLocked || (isMobile && document.getElementById('detail-modal').style.display !== 'flex')) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speed = 300.0; // 稍微加快一点移动速度适应大空间
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        if (!isMobile) {
            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        } else {
            const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            if(moveForward) camera.position.addScaledVector(dir, speed * delta * 0.15);
            if(moveBackward) camera.position.addScaledVector(dir, -speed * delta * 0.15);
        }

        if (camera.position.z < -LOOP_DISTANCE) camera.position.z += LOOP_DISTANCE;
        else if (camera.position.z > 0) camera.position.z -= LOOP_DISTANCE;
    }
    prevTime = time;
    renderer.render(scene, camera);
}
