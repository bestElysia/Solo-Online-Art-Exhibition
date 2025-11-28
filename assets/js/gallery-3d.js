import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 房间参数
const ROOM_W = 70;
const ROOM_D = 120;
const ROOM_H = 20; 

init();
animate();

function init() {
    // === 1. 场景配置 ===
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010); 
    scene.fog = new THREE.Fog(0x101010, 5, 80); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 40); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // 开启阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    document.body.appendChild(renderer.domElement);

    // === 灯光 ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15); 
    scene.add(ambientLight);

    // === 建造画廊 ===
    buildRoom();

    // === 挂画 (配置每一幅画的详细信息) ===
    // 参数说明：addArt(图片路径, 宽, 高, x, y, z, 旋转角度, 标题, 日期, 尺寸, 简介)
    
    // 示例画框尺寸
    const W = 12; const H = 10;
    
    // --- 左墙 (x = -35) ---
    addArt('assets/images/gallery/eg1.jpg', W, H, -34.6, 10, -30, Math.PI/2, 
        "静谧的午后", "2018年 5月", "80x60cm", "这幅画描绘了午后阳光洒在窗台的景象，试图捕捉光影流动的瞬间。");
        
    addArt('assets/images/gallery/eg2.jpg', W, H, -34.6, 10, -10, Math.PI/2, 
        "山峦习作", "2019年 11月", "100x80cm", "尝试使用厚涂法表现山脉的肌理，使用了大量的冷色调。");
        
    addArt('assets/images/gallery/eg3.jpg', W, H, -34.6, 10,  10, Math.PI/2, 
        "无题 No.3", "2020年 2月", "60x60cm", "疫情期间的抽象创作，表达一种混乱中的秩序感。");
        
    addArt('assets/images/gallery/eg4.jpg', W, H, -34.6, 10,  30, Math.PI/2, 
        "红色构图", "2021年 7月", "120x90cm", "对色彩心理学的一次探索实验。");

    // --- 右墙 (x = 35) ---
    addArt('assets/images/gallery/eg5.jpg', W, H,  34.6, 10, -30, -Math.PI/2, "海边速写", "2022年 8月", "40x30cm", "旅行时的快速记录，海浪的声音仿佛就在耳边。");
    addArt('assets/images/gallery/eg6.jpg', W, H,  34.6, 10, -10, -Math.PI/2, "枯木", "2023年 1月", "90x70cm", "生命力的另一种表现形式。");
    addArt('assets/images/gallery/eg7.jpg', W, H,  34.6, 10,  10, -Math.PI/2, "梦境 I", "2023年 6月", "150x150cm", "超现实主义风格的尝试，梦境与现实的交织。");
    addArt('assets/images/gallery/eg8.jpg', W, H,  34.6, 10,  30, -Math.PI/2, "梦境 II", "2023年 7月", "150x150cm", "系列的第二幅，色彩更加深沉。");

    // --- 前墙 (z = -60) ---
    addArt('assets/images/gallery/eg9.jpg',  W, H, -12, 10, -59.6, 0, "年度特展 A", "2024年", "200x150cm", "年度最重要的作品之一，耗时三个月完成。");
    addArt('assets/images/gallery/eg10.jpg', W, H,  12, 10, -59.6, 0, "年度特展 B", "2024年", "200x150cm", "与特展A形成互补关系。");

    // --- 后墙 (z = 60) ---
    addArt('assets/images/gallery/eg11.jpg', W, H, -12, 10,  59.6, Math.PI, "早期素描", "2016年", "30x20cm", "大学时期的课堂练习。");
    addArt('assets/images/gallery/eg12.jpg', W, H,  12, 10,  59.6, Math.PI, "自画像", "2017年", "50x40cm", "镜子里的自己。");


    // === 控制器逻辑 ===
    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    blocker.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => { blocker.style.opacity = 0; setTimeout(()=>blocker.style.display='none', 400)});
    controls.addEventListener('unlock', () => { blocker.style.display = 'flex'; setTimeout(()=>blocker.style.opacity = 1, 10)});
    scene.add(controls.getObject());

    const onKeyDown = (e) => { switch(e.code){ case 'KeyW':moveForward=true;break; case 'KeyA':moveLeft=true;break; case 'KeyS':moveBackward=true;break; case 'KeyD':moveRight=true;break; } };
    const onKeyUp = (e) => { switch(e.code){ case 'KeyW':moveForward=false;break; case 'KeyA':moveLeft=false;break; case 'KeyS':moveBackward=false;break; case 'KeyD':moveRight=false;break; } };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

// === 建造画廊 ===
function buildRoom() {
    // 地板
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 墙壁
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 }); 
    const createWall = (w, h, x, y, z, ry) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = ry;
        mesh.receiveShadow = true;
        scene.add(mesh);
    };
    createWall(ROOM_D, ROOM_H, -ROOM_W/2, ROOM_H/2, 0, Math.PI/2); 
    createWall(ROOM_D, ROOM_H, ROOM_W/2, ROOM_H/2, 0, -Math.PI/2); 
    createWall(ROOM_W, ROOM_H, 0, ROOM_H/2, -ROOM_D/2, 0); 
    createWall(ROOM_W, ROOM_H, 0, ROOM_H/2, ROOM_D/2, Math.PI); 

    // 踢脚线
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 1, 0.5), skirtMat); s1.position.set(0, 0.5, -ROOM_D/2); scene.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 1, 0.5), skirtMat); s2.position.set(0, 0.5, ROOM_D/2); scene.add(s2);
    const s3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, ROOM_D), skirtMat); s3.position.set(-ROOM_W/2, 0.5, 0); scene.add(s3);
    const s4 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, ROOM_D), skirtMat); s4.position.set(ROOM_W/2, 0.5, 0); scene.add(s4);
}

// === 核心：挂画系统 ===
function addArt(url, w, h, x, y, z, ry, title, date, size, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    // 1. 画框 (Outer Frame) - 深色木纹/金属感
    const frameDepth = 0.5;
    const frameBorder = 0.8; // 边框宽度
    const frameGeo = new THREE.BoxGeometry(w + frameBorder, h + frameBorder, frameDepth);
    const frameMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, // 深黑色
        roughness: 0.5, 
        metalness: 0.1 
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // 2. 画心 (Canvas) - 稍微凸出一点
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = frameDepth / 2 + 0.05; // 比画框稍微凸出一点点
    group.add(canvas);

    // 3. 暗金色名牌 (Label)
    const labelW = 3.5;
    const labelH = 2.0;
    // 调用函数生成文字贴图
    const labelTexture = createLabelTexture(title, date, size, desc);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture });
    const labelGeo = new THREE.PlaneGeometry(labelW, labelH);
    const label = new THREE.Mesh(labelGeo, labelMat);
    
    // 名牌位置：画的右下角，再往下一点，往右一点
    label.position.set(w/2 + 2.5, -h/3, 0.1); 
    group.add(label);

    // 4. 射灯
    const spotLight = new THREE.SpotLight(0xfff5e6, 150);
    spotLight.position.set(0, 15, 8);
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.4;
    spotLight.distance = 40;
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    group.add(spotLight);
    group.add(spotLight.target);

    scene.add(group);
}

// === 辅助函数：生成名牌贴图 ===
function createLabelTexture(title, date, size, desc) {
    // 创建一个高分辨率的画布
    const canvas = document.createElement('canvas');
    canvas.width = 512; 
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. 背景色：暗金色/拉丝铜色
    ctx.fillStyle = '#C5A059'; 
    ctx.fillRect(0, 0, 512, 256);

    // 可选：加个深色边框
    ctx.strokeStyle = '#5c4519';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 512, 256);

    // 2. 文字样式配置
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#222222'; // 墨黑色文字

    // 3. 绘制标题
    ctx.font = 'bold 48px "Songti SC", serif'; // 宋体更有艺术感
    ctx.fillText(title, 25, 25);

    // 4. 绘制日期和尺寸 (小一号字)
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#444444';
    ctx.fillText(date + ' | ' + size, 25, 85);

    // 5. 绘制简介 (自动换行)
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#222222';
    const maxWidth = 460;
    const lineHeight = 34;
    const x = 25;
    let y = 140; // 起始Y坐标

    // 简单的换行逻辑
    let words = desc.split(''); // 逐字分割（对中文友好）
    let line = '';
    
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n];
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n];
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y); // 绘制最后一行

    // 将画布转为纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked) {
        const delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        const speed = 200.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
        
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }
    prevTime = time;
    renderer.render(scene, camera);
}
