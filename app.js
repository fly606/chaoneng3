const 容器 = document.querySelector('#app');
const 进度条 = document.querySelector('#progressBar');
const 粒子画布 = document.querySelector('#particleCanvas');
const 粒子笔 = 粒子画布.getContext('2d');
const 提示框 = document.querySelector('#toast');
const 状态 = { 香气: 0, 擦除: 0, 旋转: 0, 已开声: false, 音频: null, 主增益: null, 粒子: [] };

function 显示提示(文字) {
  提示框.textContent = 文字;
  提示框.classList.add('show');
  clearTimeout(显示提示.timer);
  显示提示.timer = setTimeout(() => 提示框.classList.remove('show'), 1800);
}

function 调整画布() {
  const 比例 = window.devicePixelRatio || 1;
  粒子画布.width = innerWidth * 比例;
  粒子画布.height = innerHeight * 比例;
  粒子笔.setTransform(比例, 0, 0, 比例, 0, 0);
  初始化擦除画布();
}

function 播放音符(频率 = 330, 时长 = 0.18, 类型 = 'sine') {
  if (!状态.已开声 || !状态.音频) return;
  const 振荡器 = 状态.音频.createOscillator();
  const 增益 = 状态.音频.createGain();
  振荡器.type = 类型;
  振荡器.frequency.value = 频率;
  增益.gain.setValueAtTime(0.0001, 状态.音频.currentTime);
  增益.gain.exponentialRampToValueAtTime(0.16, 状态.音频.currentTime + 0.02);
  增益.gain.exponentialRampToValueAtTime(0.0001, 状态.音频.currentTime + 时长);
  振荡器.connect(增益).connect(状态.主增益);
  振荡器.start();
  振荡器.stop(状态.音频.currentTime + 时长 + 0.03);
}

function 开启声音() {
  if (状态.已开声) return;
  const 音频环境 = window.AudioContext || window.webkitAudioContext;
  if (!音频环境) return 显示提示('当前浏览器不支持 Web Audio');
  状态.音频 = new 音频环境();
  状态.主增益 = 状态.音频.createGain();
  状态.主增益.gain.value = 0.28;
  状态.主增益.connect(状态.音频.destination);
  状态.已开声 = true;
  document.querySelector('#soundToggle').textContent = '香';
  播放音符(528, 0.28, 'triangle');
}

document.addEventListener('pointerdown', 开启声音, { once: true });
document.querySelector('#soundToggle').addEventListener('click', 开启声音);

function 添加粒子(x, y, 数量 = 24, 色彩 = ['#fff', '#ffe66b', '#7dffd0', '#ff5ac8']) {
  for (let i = 0; i < 数量; i++) {
    状态.粒子.push({ x, y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .8) * 7, r: 2 + Math.random() * 5, life: 1, c: 色彩[Math.floor(Math.random() * 色彩.length)] });
  }
}

function 粒子循环() {
  粒子笔.clearRect(0, 0, innerWidth, innerHeight);
  状态.粒子 = 状态.粒子.filter(p => p.life > 0.02);
  状态.粒子.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .04; p.life *= .965;
    粒子笔.globalAlpha = p.life;
    粒子笔.fillStyle = p.c;
    粒子笔.beginPath();
    粒子笔.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    粒子笔.fill();
  });
  粒子笔.globalAlpha = 1;
  requestAnimationFrame(粒子循环);
}

function 初始化动效() {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.page').forEach((页) => {
      gsap.fromTo(页.querySelectorAll('.copy'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power2.out', scrollTrigger: { scroller: 容器, trigger: 页, start: 'top 70%' } });
    });
  }
  容器.addEventListener('scroll', () => {
    const 最大 = 容器.scrollHeight - 容器.clientHeight;
    进度条.style.height = `${Math.max(10, 容器.scrollTop / 最大 * 100)}%`;
    document.querySelectorAll('.parallax').forEach(层 => {
      const 深度 = Number(层.dataset.depth || .1);
      层.style.transform = `translateY(${容器.scrollTop * 深度}px)`;
    });
  }, { passive: true });
}

function 下一页() {
  容器.scrollBy({ top: innerHeight, behavior: 'smooth' });
}

document.querySelector('#shirtCorner').addEventListener('click', e => {
  开启声音();
  添加粒子(e.clientX, e.clientY, 60, ['#d8fff2', '#fff', '#b7ff77']);
  document.querySelector('.shirt-sky').style.transform = 'rotate(-9deg) translateY(-8%)';
  播放音符(392, .25, 'triangle');
  setTimeout(下一页, 650);
});

let 拖拽起点 = 0;
const 纤维世界 = document.querySelector('#fiberWorld');
纤维世界.addEventListener('pointerdown', e => { 拖拽起点 = e.clientX; 纤维世界.setPointerCapture(e.pointerId); });
纤维世界.addEventListener('pointermove', e => {
  if (!拖拽起点) return;
  const 偏移 = Math.max(-120, Math.min(120, e.clientX - 拖拽起点));
  纤维世界.style.transform = `translateX(${偏移}px)`;
});
纤维世界.addEventListener('pointerup', () => { 拖拽起点 = 0; });
document.querySelectorAll('.glow-flower').forEach(花 => 花.addEventListener('click', e => {
  状态.香气 += 1;
  添加粒子(e.clientX, e.clientY, 48, ['#a8ff8b', '#fff36e', '#70ffd9']);
  播放音符(520 + 状态.香气 * 60, .18, 'sine');
  花.style.transform = 'scale(1.55)';
}));

const 乌云 = document.querySelector('#stormCloud');
const 触点 = new Map();
let 上次角度 = null;
乌云.addEventListener('pointerdown', e => { 触点.set(e.pointerId, e); 乌云.setPointerCapture(e.pointerId); });
乌云.addEventListener('pointermove', e => {
  if (!触点.has(e.pointerId)) return;
  触点.set(e.pointerId, e);
  if (触点.size < 2) return;
  const [a, b] = [...触点.values()];
  const 角度 = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
  if (上次角度 !== null) 状态.旋转 += Math.abs(角度 - 上次角度);
  上次角度 = 角度;
  const 强度 = Math.min(1, 状态.旋转 / 180);
  乌云.style.transform = `translateX(-50%) rotate(${状态.旋转}deg) scaleX(${1 - 强度 * .35})`;
  document.querySelector('#goldRain').style.opacity = 强度;
  document.querySelector('#burstGarden').style.opacity = 强度;
  添加粒子(innerWidth / 2, innerHeight * .48, 3, ['#ffd34d', '#ff4fb0', '#2d84ff', '#4dff86']);
  if (强度 >= .98) 显示提示('天空被拧出了花香');
});
['pointerup','pointercancel'].forEach(事件 => 乌云.addEventListener(事件, e => { 触点.delete(e.pointerId); 上次角度 = null; }));

const 擦画布 = document.querySelector('#eraseCanvas');
const 擦笔 = 擦画布.getContext('2d');
function 初始化擦除画布() {
  if (!擦画布) return;
  const 比例 = window.devicePixelRatio || 1;
  const 矩形 = 擦画布.getBoundingClientRect();
  擦画布.width = 矩形.width * 比例;
  擦画布.height = 矩形.height * 比例;
  擦笔.setTransform(比例, 0, 0, 比例, 0, 0);
  擦笔.globalCompositeOperation = 'source-over';
  const 渐变 = 擦笔.createLinearGradient(0, 0, 0, 矩形.height);
  渐变.addColorStop(0, 'rgba(210,216,220,.92)');
  渐变.addColorStop(1, 'rgba(64,68,74,.96)');
  擦笔.fillStyle = 渐变;
  擦笔.fillRect(0, 0, 矩形.width, 矩形.height);
  擦笔.fillStyle = 'rgba(255,255,255,.22)';
  for (let i = 0; i < 180; i++) 擦笔.fillRect(Math.random() * 矩形.width, Math.random() * 矩形.height, Math.random() * 8, Math.random() * 8);
}
function 擦除(e) {
  const r = 擦画布.getBoundingClientRect();
  const x = (e.clientX || e.touches?.[0]?.clientX) - r.left;
  const y = (e.clientY || e.touches?.[0]?.clientY) - r.top;
  擦笔.globalCompositeOperation = 'destination-out';
  擦笔.beginPath(); 擦笔.arc(x, y, 46, 0, Math.PI * 2); 擦笔.fill();
  状态.擦除 += 1;
  if (状态.擦除 === 18) document.querySelector('#eraseCopy').style.opacity = 1;
  添加粒子(x, y, 2, ['#ffffff', '#ffdc58']);
}
擦画布.addEventListener('pointerdown', e => { 擦画布.setPointerCapture(e.pointerId); 擦除(e); });
擦画布.addEventListener('pointermove', e => { if (e.buttons) 擦除(e); });

const 衣服列表 = document.querySelectorAll('.cloth');
衣服列表.forEach(衣服 => 衣服.addEventListener('click', e => {
  状态.香气 += 2;
  衣服.style.transform = 'scaleX(1.8) rotate(8deg)';
  添加粒子(e.clientX, e.clientY, 100, ['#fff', '#ff85c7', '#ffe470', '#91ffe1']);
  播放音符(660, .25, 'triangle');
  显示提示(`${衣服.dataset.scent}香气已释放`);
  setTimeout(下一页, 900);
}));

function 唤醒外套() {
  const 外套 = document.querySelector('#floatingCoat');
  外套.classList.add('awake');
  document.querySelectorAll('.coat-flower').forEach((花, i) => setTimeout(() => { 花.style.opacity = 1; 花.style.transform = 'scale(1)'; }, i * 120));
  添加粒子(innerWidth / 2, innerHeight * .46, 90, ['#fff', '#adff9e', '#ff7ccc']);
  播放音符(740, .35, 'sawtooth');
}
let 上次摇动 = 0;
window.addEventListener('devicemotion', e => {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const 力量 = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
  if (力量 > 34 && Date.now() - 上次摇动 > 900) { 上次摇动 = Date.now(); 唤醒外套(); }
});
document.querySelector('#shakeFallback').addEventListener('click', 唤醒外套);

let 长按计时 = null;
const 长按按钮 = document.querySelector('#holdButton');
长按按钮.addEventListener('pointerdown', () => {
  长按计时 = setTimeout(() => {
    document.querySelector('.vortex').style.animationDuration = '.55s';
    document.querySelector('#washerCopy').style.opacity = 1;
    添加粒子(innerWidth / 2, innerHeight / 2, 120, ['#65ffd4', '#ffffff', '#ffd84f']);
    播放音符(220, .6, 'square');
    setTimeout(下一页, 1000);
  }, 900);
});
['pointerup','pointerleave','pointercancel'].forEach(事件 => 长按按钮.addEventListener(事件, () => clearTimeout(长按计时)));

const 产品观察 = new IntersectionObserver(条目 => 条目.forEach(项 => {
  if (项.isIntersecting) {
    document.querySelector('#worldDrop').style.transform = 'translate(-50%,-50%) scale(0)';
    document.querySelector('#productWrap').style.opacity = 1;
    添加粒子(innerWidth / 2, innerHeight * .38, 160, ['#fff', '#ffe260', '#7cffd4', '#ff6fb9']);
  }
}), { root: 容器, threshold: .6 });
产品观察.observe(document.querySelector('.page-8'));

document.querySelectorAll('.scent-card').forEach(卡 => 卡.addEventListener('click', () => {
  卡.classList.add('open');
  卡.querySelector('strong').textContent = 卡.dataset.value;
  状态.香气 += 1;
  播放音符(480 + 状态.香气 * 30, .18, 'triangle');
  添加粒子(innerWidth / 2, innerHeight / 2, 35, ['#fff', '#ffe86d', '#ff81d0']);
}));

function 生成结果() {
  const 标题 = 状态.香气 > 8 ? '白鸢木檀花园人格' : 状态.旋转 > 120 ? '金色雨后花园人格' : '柔雾鸢尾花园人格';
  document.querySelector('#resultTitle').textContent = 标题;
}
new IntersectionObserver(条目 => 条目.forEach(项 => { if (项.isIntersecting) 生成结果(); }), { root: 容器, threshold: .7 }).observe(document.querySelector('.page-10'));

document.querySelector('#savePoster').addEventListener('click', () => 显示提示('已生成结果海报，可截图保存'));
document.querySelector('#shareFriend').addEventListener('click', async () => {
  const 文案 = '我洗掉了世界的灰，生成了植物疗愈人格。';
  if (navigator.share) await navigator.share({ title: '洗掉世界的灰', text: 文案 });
  else 显示提示('复制分享文案：' + 文案);
});
document.querySelector('#replay').addEventListener('click', () => 容器.scrollTo({ top: 0, behavior: 'smooth' }));

window.addEventListener('resize', 调整画布);
调整画布();
粒子循环();
初始化动效();
