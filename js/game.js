// js/game.js

// 統一初始化各模組邏輯 (被 app.js 呼叫)
function initModLogic(mod) {
    if (mod === 'mod1') m1_generateQuestion();
    else if (mod === 'mod2') m2_init();
    else if (mod === 'mod3') m3_init();
    else if (mod === 'mod4') m4_init();
    else if (mod === 'mod5') m5_init();
    else if (mod === 'mod6') m6_init_logic();
}

// ==================== Mod 1: 單位轉換 ====================
// 加入 CSS 畫的精準砂糖 (修正圖示)
const m1_cssSugarGrain = `<div class="w-4 h-4 bg-white border-2 border-gray-300 shadow-sm transform rotate-45 inline-block mx-2"></div>`;
const m1_cssFridge = `<div class="w-10 h-14 bg-gray-50 border-2 border-gray-400 rounded-sm relative inline-block mx-2"><div class="absolute top-[35%] w-full border-t-2 border-gray-400"></div></div>`;

// 移除重複的除法規則，統一使用 op: 'mul'，讓系統自動產生除法反轉題
const m1_rules = [
    { from: 'km', to: 'm', rate: 1000, op: 'mul', iFrom: '🛣️', dFrom: '約 1 條街', iTo: '🚪', dTo: '約一道門的闊度', exp: '乘 1000' },
    { from: 'm', to: 'cm', rate: 100, op: 'mul', iFrom: '🚪', dFrom: '約一道門的闊度', iTo: '☝️', dTo: '約一隻手指的闊度', exp: '乘 100' },
    { from: 'cm', to: 'mm', rate: 10, op: 'mul', iFrom: '☝️', dFrom: '約一隻手指的闊度', iTo: '🐜', dTo: '約 1 隻螞蟻', exp: '乘 10' },
    { from: 'kg', to: 'g', rate: 1000, op: 'mul', iFrom: `<span class="text-5xl">🛍️</span>`, dFrom: '約 1 包米', iTo: '📎', dTo: '約 1 萬字夾', exp: '乘 1000' },
    { from: 'g', to: 'mg', rate: 1000, op: 'mul', iFrom: '📎', dFrom: '約 1 萬字夾', iTo: m1_cssSugarGrain, dTo: '約 1 粒砂糖', exp: '乘 1000' },
    { from: 'm³', to: 'L', rate: 1000, op: 'mul', iFrom: m1_cssFridge, dFrom: '約 1 個雪櫃', iTo: '🥛', dTo: '約 1 盒奶', exp: '乘 1000' },
    { from: 'L', to: 'mL', rate: 1000, op: 'mul', iFrom: '🥛', dFrom: '約 1 盒奶', iTo: '🍬', dTo: '約 1 粒M&M', exp: '乘 1000' },
    { from: 'cm³', to: 'mL', rate: 1, op: 'mul', iFrom: '🎲', dFrom: '約 1 粒骰子', iTo: '🍬', dTo: '約 1 粒M&M', exp: '一樣大' },
    { from: 'm³', to: 'cm³', rate: 1000000, op: 'mul', iFrom: m1_cssFridge, dFrom: '約 1 個雪櫃', iTo: '🎲', dTo: '約 1 粒骰子', exp: '乘 1,000,000 (一百萬)' },
    { from: 'h', to: 'min', rate: 60, op: 'mul', iFrom: '📺', dFrom: '約 2 集卡通', iTo: '🚦', dTo: '等一次紅綠燈', exp: '乘 60' },
    { from: 'min', to: 's', rate: 60, op: 'mul', iFrom: '🚦', dFrom: '等一次紅綠燈', iTo: '👁️', dTo: '眨一次眼', exp: '乘 60' }
];

let m1_ruleBag = [];

function m1_generateQuestion() {
    // 如果題庫空了，重新洗牌
    if (m1_ruleBag.length === 0) {
        m1_ruleBag = [...m1_rules];
        m1_ruleBag.sort(() => Math.random() - 0.5);
    }
    const r = m1_ruleBag.pop();

    // 隨機產生整數或小數 (例如 12 或 4.5)
    let qV = (Math.random() < 0.5) ? Math.floor(Math.random() * 9) + 2 : Number((Math.random() * 9 + 1).toFixed(1));

    // 決定是否反轉為除法題
    let isDiv = Math.random() > 0.5 && r.rate > 1;

    // 【精度修復】精準度提升至 8 位小數 (toFixed(8))，這樣除以 1000000 才不會變成 0
    let ans = isDiv ? Number((qV / r.rate).toFixed(8)) : Number((qV * r.rate).toFixed(8));

    // 更新畫面圖示與文字
    document.getElementById('m1-iconFrom').innerHTML = isDiv ? r.iTo : r.iFrom;
    document.getElementById('m1-descFrom').innerText = isDiv ? r.dTo : r.dFrom;
    document.getElementById('m1-unitFrom').innerText = isDiv ? r.to : r.from;

    document.getElementById('m1-iconTo').innerHTML = isDiv ? r.iFrom : r.iTo;
    document.getElementById('m1-descTo').innerText = isDiv ? r.dFrom : r.dTo;
    document.getElementById('m1-unitTo').innerText = isDiv ? r.from : r.to;

    document.getElementById('m1-qValue').innerText = qV;
    document.getElementById('m1-qUnit').innerText = isDiv ? r.to : r.from;
    document.getElementById('m1-tUnit').innerText = isDiv ? r.from : r.to;

    const opts = document.getElementById('m1-options');
    opts.innerHTML = '';
    let set = new Set([ans]);

    // 產生常犯錯誤的干擾選項
    if (r.rate > 1) {
        set.add(Number((qV * (r.rate * 10)).toFixed(8)));
        set.add(Number((qV / (r.rate * 10)).toFixed(8)));
    }

    // 【修復網頁當機】加入 attempts 安全計數器，防止迴圈卡死
    let attempts = 0;
    while (set.size < 4 && attempts < 50) {
        // 隨機產生更多樣化的干擾數字 (10, 100, 0.1, 0.01)
        let multi = Math.random() > 0.5 ? (Math.random() > 0.5 ? 10 : 100) : (Math.random() > 0.5 ? 0.1 : 0.01);
        let wrongAns = Number((ans * multi).toFixed(8));

        if (wrongAns === 0 || wrongAns === ans) {
            wrongAns = Number((ans + qV).toFixed(8));
        }
        set.add(wrongAns);
        attempts++; // 計數器增加，超過 50 次自動放棄，絕不當機
    }

    // 【終極防線】如果運氣極差，產生了 50 次還湊不滿 4 個選項，強制加數字補齊
    let fallback = 1;
    while (set.size < 4) {
        set.add(Number((ans + fallback).toFixed(8)));
        fallback++;
    }

    // 渲染按鈕
    Array.from(set).sort(() => Math.random() - 0.5).forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'bg-white text-indigo-700 border-4 border-indigo-200 font-black text-xl md:text-2xl py-6 rounded-2xl shadow hover:bg-indigo-50 active:scale-95 break-all transition';
        btn.innerText = o;
        btn.id = 'm1-btn-' + Math.random().toString(36).substr(2, 9);
        btn.onclick = () => {
            if (o === ans) {
                handleCorrect(btn.id, m1_generateQuestion);
            } else {
                let expText = isDiv ? '除以 ' + r.rate : '乘 ' + r.rate;
                if (r.rate === 1) expText = '不變 (一樣大)'; // 針對 cm³ 和 mL 的提示
                handleWrong(btn.id, `數字需要 <span class="text-red-600 font-black">${expText}</span>！`);
            }
        };
        opts.appendChild(btn);
    });
}


// ==================== Mod 2: 看刻度 ====================
let m2_input = ""; let m2_q = {};
const m2_insts = [
    { type: 'cylinder', title: '量筒 (mL)', unit: 'mL', max: 50, major: 10, sub: 5 }, // 1小格 2mL
    { type: 'cylinder', title: '量筒 (mL)', unit: 'mL', max: 100, major: 20, sub: 10 },// 1小格 2mL
    { type: 'cylinder', title: '量筒 (mL)', unit: 'mL', max: 10, major: 2, sub: 10 },  // 1小格 0.2mL
    // 直尺變化 (1格1mm=0.1cm, 1格2mm=0.2cm, 1格5mm=0.5cm)
    { type: 'ruler', title: '直尺 (cm)', unit: 'cm', max: 10, major: 1, sub: 10 },
    { type: 'ruler', title: '直尺 (cm)', unit: 'cm', max: 10, major: 2, sub: 10 },
    { type: 'ruler', title: '直尺 (cm)', unit: 'cm', max: 10, major: 5, sub: 10 },
    // 温度計變化 (1格1度, 1格2度, 1格0.5度)
    { type: 'thermo', title: '温度計 (°C)', unit: '°C', max: 50, major: 10, sub: 10 },
    { type: 'thermo', title: '温度計 (°C)', unit: '°C', max: 100, major: 20, sub: 10 },
    { type: 'thermo', title: '温度計 (°C)', unit: '°C', max: 10, major: 5, sub: 10 }
];

function m2_init() { m2_input = ""; document.getElementById('m2-inputDisplay').innerText = ""; m2_generateQuestion(); }
function m2Type(c) { if (c === '.' && m2_input.includes('.')) return; if (m2_input.length > 5) return; m2_input += c; document.getElementById('m2-inputDisplay').innerText = m2_input; }
function m2Del() { m2_input = m2_input.slice(0, -1); document.getElementById('m2-inputDisplay').innerText = m2_input; }

function m2_generateQuestion() {
    m2_input = ""; document.getElementById('m2-inputDisplay').innerText = "";

    // 強制重置按鈕狀態，解決「正確」文字殘留
    const btn = document.getElementById('m2-submitBtn');
    if (btn) { btn.innerText = "提交答案"; btn.classList.remove('bg-green-500', 'bg-red-500', 'text-white'); }

    const ins = m2_insts[Math.floor(Math.random() * m2_insts.length)];
    const mS = ins.major / ins.sub;

    // 只有量筒會考半格，直尺與温度計一律只考整數格
    const step = (ins.type === 'cylinder') ? mS / 2 : mS;
    const maxSteps = ins.max / step;

    let ans = Number(((Math.floor(Math.random() * (maxSteps * 0.8)) + maxSteps * 0.1) * step).toFixed(2));
    m2_q = { ins, answer: ans, mS };
    document.getElementById('m2-instrumentTitle').innerText = ins.title;
    document.getElementById('m2-inputUnit').innerText = ins.unit;

    const cvs = document.getElementById('m2-canvas'); const p = (ans / ins.max) * 100;
    if (ins.type === 'cylinder') {
        cvs.innerHTML = `<div class="relative w-28 h-[90%] border-4 border-t-0 border-slate-400 bg-slate-50 rounded-b-2xl mx-auto flex flex-col justify-end pb-4 pt-4 overflow-hidden"><div class="relative w-full h-full"><div class="absolute bottom-0 w-full bg-teal-300" style="height:calc(${p}% + 15px);"></div><div class="absolute w-[120%] left-[-10%] h-6 bg-slate-50 border-b-2 border-teal-600 rounded-[50%] z-10" style="bottom:${p}%;"></div><div class="absolute inset-0 flex flex-col-reverse justify-between z-20 pointer-events-none">${m2_buildTicks(ins, 'w-4 border-b-2', 'w-8 border-b-4', 'ml-8 -mt-2.5')}</div></div></div>`;
    } else if (ins.type === 'ruler') {
        cvs.innerHTML = `<div class="relative w-full h-[60%] flex flex-col justify-center px-6"><div class="relative w-[96%] mx-auto"><div class="absolute bottom-full mb-[1px] h-12 bg-emerald-400 border-t-2 border-l-2 border-emerald-600 z-10" style="left:0; width:${p}%;"></div><div class="w-full h-16 bg-yellow-200 border-2 border-yellow-600 relative"><div class="absolute inset-0 z-20">${m2_buildTicks(ins)}</div></div></div></div>`;
    } else if (ins.type === 'thermo') {
        cvs.innerHTML = `<div class="relative w-12 h-[80%] border-4 border-slate-400 bg-white rounded-t-full mx-auto flex flex-col justify-end items-center pb-8 pt-4"><div class="absolute -bottom-6 w-16 h-16 bg-red-600 rounded-full border-4 border-slate-400 z-10"></div><div class="relative w-full h-full flex justify-center"><div class="absolute bottom-[-2rem] w-4 bg-red-600 rounded-t-full" style="height:calc(${p}% + 2rem);"></div><div class="absolute inset-0 flex flex-col-reverse justify-between z-20 ml-6 w-full pointer-events-none">${m2_buildTicks(ins, 'w-3 border-b-2', 'w-6 border-b-4', 'ml-8 -mt-2.5')}</div></div></div>`;
    }
}

// 完美定位的刻度生成引擎
function m2_buildTicks(inst, minorClass, majorClass, textPos) {
    let html = ''; const totalTicks = (inst.max / inst.major) * inst.sub;
    for (let i = 0; i <= totalTicks; i++) {
        const isMajor = i % inst.sub === 0;
        const val = (i / inst.sub) * inst.major;

        if (inst.type === 'ruler') {
            const posPercent = (i / totalTicks) * 100;
            if (isMajor) html += `<div class="absolute top-0 w-[2px] h-6 bg-slate-700" style="left: ${posPercent}%; transform: translateX(-50%);"><span class="absolute top-[26px] left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700">${val}</span></div>`;
            else html += `<div class="absolute top-0 w-[2px] h-3 bg-slate-500" style="left: ${posPercent}%; transform: translateX(-50%);"></div>`;
        } else {
            if (isMajor) html += `<div class="${majorClass} border-slate-700 relative"><span class="absolute ${textPos} text-sm font-bold text-slate-700">${val}</span></div>`;
            else html += `<div class="${minorClass} border-slate-500"></div>`;
        }
    }
    return html;
}

function m2CheckAnswer() {
    if (m2_input === "") return;
    if (Number(m2_input) === m2_q.answer) handleCorrect('m2-submitBtn', m2_init);
    else handleWrong('m2-submitBtn', `大格 <strong>${m2_q.ins.major}</strong>，分 <strong>${m2_q.ins.sub}</strong> 小格。<br>每小格：<span class="text-xl text-red-600">${m2_q.mS}</span>${m2_q.ins.type === 'cylinder' ? '<br><br>👁️ 視線必須對準<strong>彎液面最底部</strong>！' : ''}`);
    if (!isChallengeMode) { m2_input = ""; document.getElementById('m2-inputDisplay').innerText = ""; }
}

// ==================== Mod 3: 微小物件 ====================
let m3_input = ""; let m3_q = {};
const m3_sc = [{ icon: '📄', name: 'A4 紙', t: '厚度', u: 'mm', q: [100, 200, 500], r: [0.08, 0.12] }, { icon: '🪙', name: '硬幣', t: '厚度', u: 'mm', q: [10, 20, 50], r: [1.5, 1.9] }, { icon: '📎', name: '萬字夾', t: '質量', u: 'g', q: [50, 100, 200], r: [0.4, 0.9] }, { icon: '💧', name: '水滴', t: '體積', u: 'mL', q: [20, 50], r: [0.04, 0.08] }];
function m3_init() { m3_input = ""; document.getElementById('m3-inputDisplay').innerText = ""; m3_generateQuestion(); }
function m3Type(c) { if (c === '.' && m3_input.includes('.')) return; if (m3_input.length > 5) return; m3_input += c; document.getElementById('m3-inputDisplay').innerText = m3_input; }
function m3Del() { m3_input = m3_input.slice(0, -1); document.getElementById('m3-inputDisplay').innerText = m3_input; }
function m3_generateQuestion() {
    m3_input = ""; document.getElementById('m3-inputDisplay').innerText = "";

    // 強制重置按鈕
    const btn = document.getElementById('m3-submitBtn');
    if (btn) { btn.innerText = "提交答案"; btn.classList.remove('bg-green-500', 'bg-red-500', 'text-white'); }

    const sc = m3_sc[Math.floor(Math.random() * m3_sc.length)];
    const qty = sc.q[Math.floor(Math.random() * sc.q.length)]; const ans = Number((Math.random() * (sc.r[1] - sc.r[0]) + sc.r[0]).toFixed(2)); const total = Number((ans * qty).toFixed(2));
    m3_q = { sc, qty, total, answer: ans };
    document.getElementById('m3-icon').innerHTML = sc.t === '厚度' ? `<div class="absolute w-full h-full"><div class="absolute left-0 top-[24px] text-6xl drop-shadow-sm">${sc.icon}</div><div class="absolute left-0 top-[12px] text-6xl drop-shadow-sm">${sc.icon}</div><div class="absolute left-0 top-[0px] text-6xl drop-shadow-md">${sc.icon}</div></div>` : `<div class="absolute inset-0 flex justify-center items-center text-5xl tracking-tighter">${sc.icon.repeat(3)}</div>`;
    document.getElementById('m3-qtyBadge').innerText = `數量: ${qty} 個`; document.getElementById('m3-objName').innerText = `一堆 ${sc.name}`; document.getElementById('m3-totalVal').innerText = total; document.getElementById('m3-unit').innerText = sc.u; document.getElementById('m3-measureType').innerText = `總${sc.t}`; document.getElementById('m3-questionText').innerText = `求 1 個 ${sc.name} 的${sc.t} = ?`; document.getElementById('m3-inputUnit').innerText = sc.u;
}
function m3CheckAnswer() {
    if (m3_input === "") return;
    if (Number(m3_input) === m3_q.answer) handleCorrect('m3-submitBtn', m3_init);
    else handleWrong('m3-submitBtn', `總結果 ÷ 總數 = 單一數值<br><span class="text-2xl text-red-600">${m3_q.total} ÷ ${m3_q.qty} = ?</span>`);
    if (!isChallengeMode) { m3_input = ""; document.getElementById('m3-inputDisplay').innerText = ""; }
}

// ==================== Mod 4: 重複量度 ====================
let m4_input = ""; let m4_q = {};
const m4_sc = [{ n: '木塊', t: '長度', u: 'cm', b: [10, 15, 20] }, { n: '燒杯', t: '質量', u: 'g', b: [45, 50, 60] }, { n: '單擺', t: '時間', u: 's', b: [12, 14, 18] }];
function m4_init() { m4_input = ""; document.getElementById('m4-inputDisplay').innerText = ""; m4_generateQuestion(); }
function m4Type(c) { if (c === '.' && m4_input.includes('.')) return; if (m4_input.length > 5) return; m4_input += c; document.getElementById('m4-inputDisplay').innerText = m4_input; }
function m4Del() { m4_input = m4_input.slice(0, -1); document.getElementById('m4-inputDisplay').innerText = m4_input; }
function m4_generateQuestion() {
    m4_input = ""; document.getElementById('m4-inputDisplay').innerText = "";

    // 強制重置按鈕
    const btn = document.getElementById('m4-submitBtn');
    if (btn) { btn.innerText = "提交答案"; btn.classList.remove('bg-green-500', 'bg-red-500', 'text-white'); }

    const sc = m4_sc[Math.floor(Math.random() * m4_sc.length)]; let n = Math.floor(Math.random() * 3) + 3;
    let tA = Number((sc.b[Math.floor(Math.random() * sc.b.length)] + (Math.floor(Math.random() * 9) / 10)).toFixed(1)); let v = Array(n).fill(tA);
    for (let i = 0; i < n + 2; i++) { let id1 = Math.floor(Math.random() * n), id2 = Math.floor(Math.random() * n); if (id1 !== id2) { let d = (Math.floor(Math.random() * 2) + 1) / 10; v[id1] = Number((v[id1] + d).toFixed(1)); v[id2] = Number((v[id2] - d).toFixed(1)); } }
    m4_q = { n, v, sum: Number(v.reduce((a, b) => a + b, 0).toFixed(1)), answer: tA };
    document.getElementById('m4-objName').innerText = sc.n; document.getElementById('m4-measureType').innerText = sc.t; document.getElementById('m4-timesCount').innerText = n; document.getElementById('m4-inputUnit').innerText = sc.u;
    let h = ''; v.forEach((x, i) => h += `<div class="flex justify-between items-center bg-white p-3 rounded mb-2 border border-yellow-200 shadow-sm"><span class="text-gray-500 font-bold">第 ${i + 1} 次</span><span class="text-2xl font-black text-slate-700">${x} <span class="text-sm text-gray-400">${sc.u}</span></span></div>`); document.getElementById('m4-list').innerHTML = h;
}
function m4CheckAnswer() {
    if (m4_input === "") return;
    if (Number(m4_input) === m4_q.answer) handleCorrect('m4-submitBtn', m4_init);
    else handleWrong('m4-submitBtn', `(總和) ÷ 次數<br>總和 = <strong>${m4_q.sum}</strong><br><span class="text-2xl text-red-600">${m4_q.sum} ÷ ${m4_q.n} = ?</span>`);
    if (!isChallengeMode) { m4_input = ""; document.getElementById('m4-inputDisplay').innerText = ""; }
}

// ==================== Mod 5: 排水法 ====================
let m5_input = ""; let m5_q = {};
const m5_objs = [{ name: '波子', icon: '🔵' }, { name: '螺帽', icon: '🔩' }, { name: '石頭', icon: '🪨' }];
function m5_init() { m5_input = ""; document.getElementById('m5-inputDisplay').innerText = ""; m5_generateQuestion(); }
function m5Type(c) { if (c === '.' && m5_input.includes('.')) return; if (m5_input.length > 5) return; m5_input += c; document.getElementById('m5-inputDisplay').innerText = m5_input; }
function m5Del() { m5_input = m5_input.slice(0, -1); document.getElementById('m5-inputDisplay').innerText = m5_input; }
function m5_generateQuestion() {
    m5_input = ""; document.getElementById('m5-inputDisplay').innerText = "";

    // 強制重置按鈕
    const btn = document.getElementById('m5-submitBtn');
    if (btn) { btn.innerText = "提交答案"; btn.classList.remove('bg-green-500', 'bg-red-500', 'text-white'); }

    const ins = { max: 50, major: 10, sub: 10 }; const obj = m5_objs[Math.floor(Math.random() * m5_objs.length)];
    const sV = Math.floor(Math.random() * 4) + 1; const qty = Math.floor(Math.random() * 4) + 1; const tV = sV * qty;
    const v1 = Math.floor(Math.random() * (45 - tV - 10 + 1)) + 10; const v2 = v1 + tV;
    m5_q = { ins, v1, v2, qty, tV, sV, obj };
    document.getElementById('m5-questionText').innerText = `求 1 個 ${obj.name} 的體積 = ?`; document.getElementById('m5-afterLabel').innerText = `放入 ${qty} 個 ${obj.name}`;
    m5_drawCyl('m5-canvas-before', ins, v1, 0, obj.icon); m5_drawCyl('m5-canvas-after', ins, v2, qty, obj.icon);
}
function m5_drawCyl(id, ins, v, qty, icon) {
    let tks = ''; for (let i = 0; i <= ins.max; i++) { if (i % ins.major === 0) tks += `<div class="w-6 border-b-[3px] border-slate-700 relative"><span class="absolute ml-7 -mt-2 text-xs font-bold">${i}</span></div>`; else if (i % 5 === 0) tks += `<div class="w-4 border-b-2 border-slate-600"></div>`; else tks += `<div class="w-2 border-b border-slate-400"></div>`; }
    let itm = ''; for (let i = 0; i < qty; i++) itm += `<div class="absolute text-xl drop-shadow-md z-10" style="left:${10 + Math.random() * 50}%; bottom:${5 + Math.random() * 15}px;">${icon}</div>`;
    document.getElementById(id).innerHTML = `<div class="relative w-20 h-full border-4 border-t-0 border-slate-400 bg-slate-50 rounded-b-xl flex flex-col justify-end pb-2 pt-2 overflow-hidden"><div class="relative w-full h-full"><div class="absolute bottom-0 w-full bg-cyan-300" style="height:calc(${(v / ins.max) * 100}% + 10px);">${itm}</div><div class="absolute w-[120%] left-[-10%] h-4 bg-slate-50 border-b-[3px] border-cyan-500 rounded-[50%] z-10" style="bottom:${(v / ins.max) * 100}%;"></div><div class="absolute inset-0 flex flex-col-reverse justify-between z-20 pointer-events-none">${tks}</div></div></div>`;
}
function m5CheckAnswer() {
    if (m5_input === "") return;
    if (Number(m5_input) === m5_q.sV) handleCorrect('m5-submitBtn', m5_init);
    else handleWrong('m5-submitBtn', `1. 總體積 = ${m5_q.v2} - ${m5_q.v1} = <strong class="text-red-600">${m5_q.tV} mL</strong><br>2. 總體積(${m5_q.tV}) ÷ 數量(${m5_q.qty}) = ?`);
    if (!isChallengeMode) { m5_input = ""; document.getElementById('m5-inputDisplay').innerText = ""; }
}

// ==================== Mod 6: 零點調整 ====================
let m6_input = ""; let m6_s = {};
function m6_init_logic() {
    m6_input = ""; document.getElementById('m6-inputDisplay').innerText = "";

    // 強制重置按鈕
    const btn = document.getElementById('m6-submitBtn');
    if (btn) { btn.innerText = "提交讀數"; btn.classList.remove('bg-green-500', 'bg-red-500', 'text-white'); }

    m6_s = { bM: Number((Math.random() * 30 + 20).toFixed(1)), lM: Number((Math.random() * 80 + 40).toFixed(1)), cM: 0, tO: 0, bOP: false, lP: false };
    m6_updateVis();
}
function m6Type(c) { if (c === '.' && m6_input.includes('.')) return; if (m6_input.length > 5) return; m6_input += c; document.getElementById('m6-inputDisplay').innerText = m6_input; }
function m6Del() { m6_input = m6_input.slice(0, -1); document.getElementById('m6-inputDisplay').innerText = m6_input; }
function m6_placeBeaker() { if (m6_s.bOP) return; m6_s.bOP = true; m6_s.cM += m6_s.bM; m6_updateVis(); }
function m6_pressTare() { m6_s.tO = m6_s.cM; m6_updateVis(); }
function m6_pourLiquid() { if (!m6_s.bOP || m6_s.lP) return; m6_s.lP = true; m6_s.cM += m6_s.lM; m6_updateVis(); }

function m6_updateVis() {
    let r = m6_s.cM - m6_s.tO; if (Math.abs(r) < 0.01) r = 0.0; document.getElementById('m6-display').innerText = r.toFixed(1);

    const bB = document.getElementById('m6-btn-beaker');
    const bL = document.getElementById('m6-btn-liquid');
    const pan = document.getElementById('m6-pan-item');

    if (m6_s.bOP) {
        bB.className = "flex flex-col items-center opacity-30 pointer-events-none";
        if (m6_s.lP) {
            bL.className = "flex flex-col items-center opacity-30 pointer-events-none";
        } else {
            bL.className = "flex flex-col items-center transform transition active:scale-95 hover:-translate-y-2 cursor-pointer";
        }
        pan.innerHTML = `<div class="w-24 h-32 border-4 border-t-0 border-slate-400 bg-white/60 rounded-b-md relative flex flex-col justify-end overflow-hidden fade-in shadow-md">${m6_s.lP ? `<div class="w-full h-20 bg-blue-400 fade-in border-t-2 border-blue-300"></div>` : ''}</div>`;
    } else {
        bB.className = "flex flex-col items-center transform transition active:scale-95 hover:-translate-y-2 cursor-pointer";
        bL.className = "flex flex-col items-center opacity-50 pointer-events-none filter grayscale-[50%]";
        pan.innerHTML = '';
    }
}

function m6CheckAnswer() {
    if (m6_input === "") return;
    const uAns = Number(m6_input), cAns = m6_s.lM, fAns = Number((m6_s.bM + m6_s.lM).toFixed(1));
    if (uAns === cAns && m6_s.lP) {
        handleCorrect('m6-submitBtn', m6_init_logic);
    }
    else if (uAns === fAns && m6_s.lP) {
        handleWrong('m6-submitBtn', `忘記「零點調整」了！<br>${fAns} g 是 <strong class="text-blue-700">空燒杯 + 液體</strong> 的總重量。<br>請按「重新實驗」，倒入液體前要按 <strong>零點調整</strong>！`, true);
        if (!isChallengeMode) { m6_input = ""; document.getElementById('m6-inputDisplay').innerText = ""; }
    }
    else {
        handleWrong('m6-submitBtn', `1. 放上空燒杯<br>2. 按 零點調整<br>3. 倒入液體<br>4. 輸入讀數`);
        if (!isChallengeMode) { m6_input = ""; document.getElementById('m6-inputDisplay').innerText = ""; }
    }
}
