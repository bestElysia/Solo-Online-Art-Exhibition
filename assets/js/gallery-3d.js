import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const paintings = [];

// === 1. 无尽长廊核心参数 (升级版) ===
const IMG_COUNT = 12; // 图片素材只有12张
const TOTAL_PAINTINGS = 50; // 你要求展出的总画框数
const SPACING = 25; // 每排间距

// 计算循环参数
// 50幅画 = 25排 (左右各一)
const ROWS_PER_LOOP = Math.ceil(TOTAL_PAINTINGS / 2); 
const LOOP_DISTANCE = ROWS_PER_LOOP * SPACING; // 25 * 25 = 625米 的循环长度

const HALL_WIDTH = 50; 
const HALL_HEIGHT = 20; 

// 手机端变量
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0; let touchStartY = 0;

init();
animate();

function init() {
    scene = new THREE.Scene();
    const fogColor = 0xfcfcfc; 
    scene.background = new THREE.Color(fogColor); 
    // 雾气要稍微远一点，因为长廊变长了，但也不能太远以免看到循环穿帮
    scene.fog = new THREE.Fog(fogColor, 30, 160); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 9, 30); // 初始位置

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65); 
    scene.add(ambientLight);

    buildEndlessHall();

    // === 挂画 (生成50个展位，并前后增加缓冲) ===
    // 我们的核心循环是 ROWS_PER_LOOP (25排)
    // 为了无缝衔接，我们需要在视野前后多生成一些画
    // 比如：从 -5 排 生成到 35 排 (覆盖前后)
    
    const leftX = -HALL_WIDTH/2 + 0.5;
    const rightX = HALL_WIDTH/2 - 0.5;

    // 缓冲排数 (前后各加一些，保证看不见尽头)
    const BUFFER_ROWS = 8; 

    for (let i = -BUFFER_ROWS; i < ROWS_PER_LOOP + BUFFER_ROWS; i++) {
        
        // --- 核心逻辑：确保 i 对应的画作信息是固定的 ---
        // 即使 i 是负数，也要算出一个 0~49 的序号
        // 这样每次循环回来，看到的画是一样的顺序
        let normalizedRowIndex = (i % ROWS_PER_LOOP + ROWS_PER_LOOP) % ROWS_PER_LOOP;
        
        // 左墙画作索引 (0, 2, 4...)
        let leftImgIdx = (normalizedRowIndex * 2) % IMG_COUNT; 
        // 右墙画作索引 (1, 3, 5...)
        let rightImgIdx = (normalizedRowIndex * 2 + 1) % IMG_COUNT;

        // 真实的 Z 坐标
        const zPos = -i * SPACING;

        // 1. 左墙画作
        // 算出这是第几幅画 (用于显示标题)
        let leftArtNum = (normalizedRowIndex * 2) + 1; 
        let leftImgPath = `assets/images/gallery/eg${leftImgIdx + 1}.jpg`;
        // 随机一点尺寸变化
        let lW = 12 + (leftImgIdx % 3) * 2; 
        let lH = 12 + (leftImgIdx % 2) * 4;
        
        addChineseArt(leftImgPath, lW, lH, leftX, 9, zPos, Math.PI/2, 
            `作品 No.${leftArtNum}`, "Yanxu", `系列作品 ${leftArtNum}/50`);

        // 2. 右墙画作
        let rightArtNum = (normalizedRowIndex * 2) + 2;
        let rightImgPath = `assets/images/gallery/eg${rightImgIdx + 1}.jpg`;
        let rW = 12 + (rightImgIdx % 3) * 2;
        let rH = 12 + (rightImgIdx % 2) * 4;

        addChineseArt(rightImgPath, rW, rH, rightX, 9, zPos, -Math.PI/2, 
            `作品 No.${rightArtNum}`, "Yanxu", `系列作品 ${rightArtNum}/50`);
    }

    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造结构 (地板拉超长) ===
function buildEndlessHall() {
    // 地板长度设为 2000，足够覆盖视距
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, 2000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
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

    // 踢脚线
    const skirtMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const skirtGeo = new THREE.BoxGeometry(0.2, 0.8, 2000);
    const s1 = new THREE.Mesh(skirtGeo, skirtMat); s1.position.set(-HALL_WIDTH/2 + 0.1, 0.4, 0); scene.add(s1);
    const s2 = new THREE.Mesh(skirtGeo, skirtMat); s2.position.set(HALL_WIDTH/2 - 0.1, 0.4, 0); scene.add(s2);
}

function addChineseArt(url, w, h, x, y, z, ry, title, author, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    // 框
    const frameGeo = new THREE.BoxGeometry(w + 2, h + 2, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b201e, roughness: 0.6 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // 衬纸
    const mountGeo = new THREE.PlaneGeometry(w + 1.6, h + 1.6);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xf2f0eb });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = 0.21;
    group.add(mount);

    // 画心
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = 0.22;
    
    canvas.userData = { url: url, title: title, date: author, desc: desc };
    paintings.push(canvas); 
    group.add(canvas);

    // 射灯
    const spotLight = new THREE.SpotLight(0xfff5e1, 100); 
    spotLight.position.set(0, 15, 8); 
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5; 
    spotLight.distance = 35;
    spotLight.castShadow = true;
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
    document.getElementById('modal-desc').innerText = data.date + " · " + data.desc;
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

        const speed = 250.0;
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

        // === 循环逻辑 (50幅画版本) ===
        // 当我们向前走超过了 LOOP_DISTANCE (625米)，就瞬移回起点
        // 这样你会感觉自己一直在走，画作编号 1...50...1...50 循环
        if (camera.position.z < -LOOP_DISTANCE) {
            camera.position.z += LOOP_DISTANCE;
        } 
        else if (camera.position.z > 0) {
            camera.position.z -= LOOP_DISTANCE;
        }
    }
    prevTime = time;
    renderer.render(scene, camera);
}
