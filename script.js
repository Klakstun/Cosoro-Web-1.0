/**
 * ==========================================
 * SANITY LOSS CORE SCRIPT (js/script.js)
 * 深渊回声 | 理智崩溃系统
 * 包含: SAN值逻辑, 噪点画布, 随机故障, 音效扰动, 眼球追踪
 * ==========================================
 */

(function(){
    // ---------- DOM 元素绑定 ----------
    const sanDisplay = document.getElementById('sanValueDisplay');
    const warningMsg = document.getElementById('warningMsg');
    const gazeBtn = document.getElementById('gazeBtn');
    const prayBtn = document.getElementById('prayBtn');
    const resetBtn = document.getElementById('resetBtn');
    const corruptLogSpan = document.getElementById('corruptLog');
    const panelDiv = document.getElementById('sanPanel');
    
    // 眼球元素 (制造飘忽感)
    const eye1 = document.getElementById('eyeball1');
    const eye2 = document.getElementById('eyeball2');
    
    // 噪音画布
    const canvas = document.getElementById('noiseCanvas');
    let ctx = null;
    if(canvas) ctx = canvas.getContext('2d');
    
    // ---------- SAN值核心 ----------
    let sanity = 100;            // 初始理智100
    let isDead = false;          // 理智归零/崩溃标志
    let intervalIds = [];        // 存储定时器以便重置
    let activeGlitchInterval = null;
    let activeAudioTimeout = null;
    
    // ---------- 音频上下文 (Web Audio 造毛刺音效) ----------
    let audioCtx = null;
    let isAudioInit = false;
    
    // 初始化音频 (用户首次点击页面时启用, 避免浏览器策略)
    function initAudio() {
        if(isAudioInit) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // 播放一个极短静音，激活AudioContext
            const buffer = audioCtx.createBuffer(1, 1, 22050);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start();
            isAudioInit = true;
        } catch(e) { console.warn("Web Audio not supported"); }
    }
    
    // 播放掉san专属毛刺音效 (扭曲刺耳)
    function playSanitySound(intensity = 0.5) {
        if(!audioCtx || !isAudioInit) return;
        // 确保audioCtx状态为running
        if(audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                generateGlitchAudio(intensity);
            }).catch(e=>{});
        } else {
            generateGlitchAudio(intensity);
        }
    }
    
    function generateGlitchAudio(intensity) {
        if(!audioCtx) return;
        const now = audioCtx.currentTime;
        const duration = 0.25 + Math.random() * 0.4;
        const sampleRate = audioCtx.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 填充噪音 + 正弦波突变 = 精神污染
        for(let i = 0; i < frameCount; i++) {
            let t = i / sampleRate;
            // 主调：数字失真
            let noise = (Math.random() * 2 - 1) * 0.6 * intensity;
            let glitchSine = Math.sin(2 * Math.PI * (600 + Math.random() * 700) * t) * 0.3 * intensity;
            let squareWave = (Math.sin(2 * Math.PI * 180 * t) > 0 ? 0.4 : -0.4) * intensity * (Math.random() > 0.7 ? 0.8 : 0);
            data[i] = Math.max(-0.9, Math.min(0.9, noise + glitchSine + squareWave));
            // 毛刺式突变
            if(Math.random() < 0.02 * intensity) {
                data[i] = (Math.random() - 0.5) * 1.2;
            }
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.35 + intensity * 0.4;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start();
        // 快速衰减避免持续过吵
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
    }
    
    // 随机更新底部日志 (精神污染文字)
    const logMessages = [
        "> 侦测到未名低语 ...",
        "> /dev/null 渗出黑色黏液",
        "> 瞳孔震颤  ∥ 理智碎片丢失",
        "> 深渊回应了你的凝视",
        "> 记忆地址 0x3F2A 损坏",
        "> 你听见自己的骨裂声",
        "> 现实稳定性: 13%",
        "> 内脏投影异常"
    ];
        
    function updateCorruptLog() {
        if(isDead) {
            corruptLogSpan.innerHTML = "> 理智归零 · 你已化为深渊的一部分";
            return;
        }
        const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
        corruptLogSpan.innerHTML = randomMsg + `  [SAN:${sanity}]`;
        // 添加故障闪动类
        corruptLogSpan.style.animation = 'none';
        setTimeout(() => { corruptLogSpan.style.animation = 'textFlicker 2.3s infinite'; }, 20);
    }
    
    // 更新san值的UI + 全局特效
    function updateSanUI() {
        if(isDead) {
            sanDisplay.innerHTML = `SAN: 0 · 永暗`;
            warningMsg.innerHTML = `你已不复存在... 深渊吞噬了你的意识<br>点击「重置心智」 逃离疯狂？`;
            return;
        }
        let colorIntensity = Math.max(0, Math.min(255, 255 - sanity * 2.2));
        let redGlow = `0 0 ${10 + (100 - sanity) * 1.2}px rgba(255, 0, 40, 0.8)`;
        sanDisplay.style.textShadow = `0 0 6px #0f0, 0 0 ${10 + (100-sanity)/5}px rgba(255, 40, 0, 0.9)`;
        sanDisplay.innerHTML = `SAN: ${Math.floor(sanity)}`;
        
        // 改变警告文案表现
        if(sanity <= 25) {
            warningMsg.innerHTML = `意识扭曲 · 不可名状之物环绕<br>你的san值即将归零... 逃！`;
            warningMsg.style.color = `#ff6666`;
            warningMsg.style.textShadow = `0 0 5px red`;
        } else if(sanity <= 55) {
            warningMsg.innerHTML = `精神污染严重 · 幻觉侵入现实<br>眼睛在注视你`;
            warningMsg.style.color = `#ffaa88`;
        } else {
            warningMsg.innerHTML = `你的理智正在溶解...<br>不要凝视深渊`;
            warningMsg.style.color = `#ffbb88`;
        }
        // 背景面板随san变化轻微变色
        if(panelDiv) {
            let borderRed = Math.min(180, 80 + (100 - sanity)*1.6);
            panelDiv.style.borderColor = `rgba(${borderRed+40}, 80, 70, 0.7)`;
        }
        updateCorruptLog();
    }
    
    // 修改san值 (核心)
    function modifySanity(delta, reason = 'unknown') {
        if(isDead) return;
        let newSan = sanity + delta;
        if(newSan >= 100) newSan = 100;
        if(newSan <= 0) {
            newSan = 0;
            isDead = true;
            // 理智崩溃: 触发大量音效+崩溃特效
            if(audioCtx && isAudioInit) {
                for(let i=0;i<3;i++) setTimeout(()=> playSanitySound(1.0), i*150);
            }
            if(activeGlitchInterval) clearInterval(activeGlitchInterval);
            activeGlitchInterval = setInterval(()=>{
                if(isDead) triggerGlitchOnUI();
            }, 350);
            updateSanUI();
            // 显示特殊日志
            corruptLogSpan.innerHTML = "> 理智归零 · 你已化为深渊的一部分";
            return;
        }
        sanity = newSan;
        updateSanUI();
        
        // 根据掉san程度触发特效
        let intensity = Math.abs(delta) / 20;
        if(delta < 0 && Math.abs(delta) > 3) {
            triggerGlitchOnUI();
            if(intensity > 0.2) playSanitySound(Math.min(0.9, intensity));
            // 随机重置文字故障
            if(Math.random() < 0.5) flickerWarning();
        }
        if(delta > 5 && sanity < 95) {
            // 祈祷等正面效果也有柔和反馈
            if(audioCtx && isAudioInit) {
                try{
                    const shortBeep = () => {
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.frequency.value = 880;
                        gain.gain.value = 0.15;
                        osc.start();
                        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
                        osc.stop(audioCtx.currentTime + 0.3);
                    };
                    shortBeep();
                }catch(e){}
            }
        }
        
        // 如果san太低且未死亡，随机额外抽搐
        if(sanity < 20 && !isDead && Math.random() < 0.4) {
            triggerGlitchOnUI();
        }
    }
    
    // 触发UI文字闪烁/故障偏移
    function triggerGlitchOnUI() {
        if(!warningMsg) return;
        warningMsg.classList.add('glitch-blink');
        setTimeout(() => {
            if(warningMsg) warningMsg.classList.remove('glitch-blink');
        }, 150);
        // 随机偏移面板
        if(panelDiv) {
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetY = (Math.random() - 0.5) * 6;
            panelDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            setTimeout(() => { if(panelDiv) panelDiv.style.transform = ''; }, 80);
        }
    }
    
    function flickerWarning() {
        if(!warningMsg) return;
        warningMsg.style.opacity = '0.5';
        setTimeout(()=> { if(warningMsg) warningMsg.style.opacity = '1'; }, 70);
    }
    
    // ----- 凝视深渊: 大幅掉san，附带疯狂效果 -----
    function gazeIntoAbyss() {
        if(isDead) return;
        initAudio(); // 确保声音可播放
        let loss = 8 + Math.floor(Math.random() * 14);
        modifySanity(-loss, 'gaze');
        // 额外重污染: 随机多一重抖动
        for(let i=0;i<2;i++) setTimeout(()=> triggerGlitchOnUI(), i*50);
        // 如果san归零触发的死亡，停止额外循环
        if(sanity <=0) return;
        if(sanity < 30 && !isDead) {
            if(activeGlitchInterval) clearInterval(activeGlitchInterval);
            activeGlitchInterval = setInterval(()=>{
                if(!isDead && sanity < 30) triggerGlitchOnUI();
                else if(sanity >= 30 && activeGlitchInterval) { clearInterval(activeGlitchInterval); activeGlitchInterval=null; }
            }, 800);
        } else {
            if(activeGlitchInterval && sanity >=30) { clearInterval(activeGlitchInterval); activeGlitchInterval=null; }
        }
    }
    
    // 默念祷文: 回复理智，但有概率“被污染”?
    function prayForSanity() {
        if(isDead) return;
        initAudio();
        let gain = 6 + Math.floor(Math.random() * 12);
        // 20% 几率祈祷失败反而轻微掉san (深渊的嘲弄)
        if(Math.random() < 0.2 && sanity < 70) {
            modifySanity(-3, 'pray_backfire');
            triggerGlitchOnUI();
            if(corruptLogSpan) corruptLogSpan.innerHTML = "> 祷文被扭曲··· 你听到了嗤笑";
            setTimeout(()=> updateCorruptLog(), 800);
        } else {
            modifySanity(gain, 'pray');
        }
        if(sanity >= 80 && activeGlitchInterval) {
            clearInterval(activeGlitchInterval);
            activeGlitchInterval = null;
        }
    }
    
    // 重置心智  (清除死亡状态，恢复100)
    function resetMind() {
        // 清除所有额外定时器
        if(activeGlitchInterval) { clearInterval(activeGlitchInterval); activeGlitchInterval = null; }
        isDead = false;
        sanity = 100;
        updateSanUI();
        if(panelDiv) panelDiv.style.transform = '';
        warningMsg.style.opacity = '1';
        warningMsg.classList.remove('glitch-blink');
        // 播放“复苏”微弱音效
        if(audioCtx && isAudioInit) {
            try{
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = 520;
                gain.gain.value = 0.2;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
                osc.stop(audioCtx.currentTime + 0.6);
            }catch(e){}
        }
        corruptLogSpan.innerHTML = "> 意识重启 · 暂时逃离深渊";
        setTimeout(()=> updateCorruptLog(), 1000);
    }
    
    // ---------- 噪音画布 (持续掉san视觉白噪) ----------
    function drawNoise() {
        if(!canvas || !ctx) return;
        const w = canvas.width = window.innerWidth;
        const h = canvas.height = window.innerHeight;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        // 依据当前san值影响噪点强度 (san越低噪点越暴力)
        let intensity = 1.2;
        if(sanity <= 25) intensity = 2.2;
        else if(sanity <= 55) intensity = 1.6;
        else intensity = 0.9;
        
        for(let i = 0; i < data.length; i += 4) {
            const gray = Math.random() * 255 * intensity;
            const r = gray * (0.7 + Math.random() * 0.8);
            const g = gray * (0.4 + Math.random() * 0.5);
            const b = gray * (0.3 + Math.random() * 0.6);
            data[i] = r;     // R
            data[i+1] = g;   // G
            data[i+2] = b;   // B
            data[i+3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(drawNoise);
    }
    
    // 随机浮动眼球 (增加被注视感)
    function moveEyesRandom() {
        if(!eye1 || !eye2) return;
        const shiftX1 = (Math.random() - 0.5) * 12;
        const shiftY1 = (Math.random() - 0.5) * 12;
        const shiftX2 = (Math.random() - 0.5) * 14;
        const shiftY2 = (Math.random() - 0.5) * 14;
        eye1.style.transform = `translate(${shiftX1}px, ${shiftY1}px)`;
        eye2.style.transform = `translate(${shiftX2}px, ${shiftY2}px)`;
        setTimeout(() => {
            if(eye1) eye1.style.transform = '';
            if(eye2) eye2.style.transform = '';
        }, 180);
        setTimeout(moveEyesRandom, 1800 + Math.random() * 2000);
    }
    
    // 定期随机掉san (深渊潜移默化) —— 每15秒左右可能掉1~2点
    function passiveSanityDrain() {
        if(isDead) return;
        if(sanity > 5 && !isDead && Math.random() < 0.45) {
            const drain = Math.floor(Math.random() * 3) + 1;  // 1~3
            modifySanity(-drain, 'passive_whisper');
            if(drain > 1) triggerGlitchOnUI();
        }
        setTimeout(passiveSanityDrain, 12000 + Math.random() * 8000);
    }
    
    // 监听窗口大小适应画布
    function resizeCanvas() {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
    
    // 绑定按钮事件 + 首次用户交互激活音频
    function bindEvents() {
        gazeBtn.addEventListener('click', () => {
            initAudio();
            gazeIntoAbyss();
        });
        prayBtn.addEventListener('click', () => {
            initAudio();
            prayForSanity();
        });
        resetBtn.addEventListener('click', () => {
            initAudio();
            resetMind();
        });
        document.body.addEventListener('click', ()=>{
            if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        }, {once: false});
    }
    
    // 初始化所有系统
    function init() {
        if(canvas && ctx) {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            drawNoise();
        } else {
            console.warn("noise canvas missing");
        }
        updateSanUI();
        bindEvents();
        moveEyesRandom();
        passiveSanityDrain();
        // 每隔40s随机加深日志幻觉
        setInterval(() => {
            if(!isDead && Math.random()<0.5) updateCorruptLog();
            else if(!isDead) flickerWarning();
        }, 9000);
    }
    
    init();
})();