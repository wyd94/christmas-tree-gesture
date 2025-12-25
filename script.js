let model = null;
let isTreeLit = false;
let treeLights = [];

// 初始化 Three.js 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a2a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('webgl-container').appendChild(renderer.domElement);

// 添加环境光
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// 创建圣诞树（锥体 + 树干）
function createChristmasTree() {
  // 树叶（绿色锥体）
  const leavesGeometry = new THREE.ConeGeometry(2, 6, 8);
  const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 3;
  scene.add(leaves);

  // 树干（棕色圆柱）
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.75;
  scene.add(trunk);

  // 创建彩灯（随机位置的小球）
  treeLights = [];
  const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
  for (let i = 0; i < 30; i++) {
    const radius = 0.08;
    const geometry = new THREE.SphereGeometry(radius, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: lightColors[i % lightColors.length] });
    const light = new THREE.Mesh(geometry, material);
    
    // 随机分布在树上
    const angle = Math.random() * Math.PI * 2;
    const distance = 0.8 + Math.random() * 1.0;
    const y = 1 + Math.random() * 4;
    light.position.set(Math.cos(angle) * distance, y, Math.sin(angle) * distance);
    
    scene.add(light);
    treeLights.push(light);
  }
}

createChristmasTree();

// 添加点光源（顶部星星）
const starLight = new THREE.PointLight(0xffff99, 1, 20);
starLight.position.set(0, 6, 0);
scene.add(starLight);

camera.position.z = 8;

// 控制灯光开关
function toggleTreeLights(on) {
  const intensity = on ? 2 : 0;
  starLight.intensity = intensity;
  treeLights.forEach(light => {
    light.material.color.setHex(on ? light.material.color.getHex() : 0x222222);
  });
  isTreeLit = on;
}

// 启动摄像头
async function startCamera() {
  const video = document.getElementById('video');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('无法访问摄像头，请允许权限并使用 HTTPS 环境。');
    console.error(err);
  }
}

// 加载 Handtrack 模型
handTrack.load().then(lmodel => {
  model = lmodel;
  document.getElementById('loading').style.display = 'none';
  startCamera();
  runDetection();
});

// 手势检测循环
function runDetection() {
  if (!model) return;
  
  model.detect(document.getElementById('video')).then(predictions => {
    let hasOpenHand = false;
    let hasClosedHand = false;

    predictions.forEach(pred => {
      if (pred.label === 'open' && pred.confidence > 0.7) hasOpenHand = true;
      if (pred.label === 'closed' && pred.confidence > 0.7) hasClosedHand = true;
    });

    // 控制逻辑：张开手 → 开灯；握拳 → 关灯
    if (hasOpenHand && !isTreeLit) {
      toggleTreeLights(true);
    } else if (hasClosedHand && isTreeLit) {
      toggleTreeLights(false);
    }

    requestAnimationFrame(runDetection);
  });
}

// 窗口大小自适应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始关闭灯光
toggleTreeLights(false);