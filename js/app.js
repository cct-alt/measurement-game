// js/app.js

// --- 1. Firebase 基礎設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyANYFN9hgGeDlf494LBPmApo9j8j4ov9CQ",
    authDomain: "measurement-dfd9a.firebaseapp.com",
    projectId: "measurement-dfd9a",
    storageBucket: "measurement-dfd9a.firebasestorage.app",
    messagingSenderId: "173169802710",
    appId: "1:173169802710:web:55278de16ac5d01eb23877"
};

let db = null;
let isFirebaseReady = false;

try {
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    db = firebase.firestore();
    isFirebaseReady = true;
    console.log("Firebase Connected successfully!");
} catch (e) {
    console.error("Firebase init error:", e);
}

// --- 2. 系統路由與狀態 ---
let currentModule = '';
let stats = { correct: 0, wrong: 0 };
const screens = { home: 'screen-home', login: 'screen-login', end: 'screen-end', lb: 'screen-leaderboard', mod1: 'screen-mod1', mod2: 'screen-mod2', mod3: 'screen-mod3', mod4: 'screen-mod4', mod5: 'screen-mod5', mod6: 'screen-mod6' };
const modTitles = { mod1: "難點一：單位轉換", mod2: "難點二：看刻度", mod3: "難點三：微小物件", mod4: "難點四：重複量度", mod5: "難點五：排水法", mod6: "難點六：零點調整" };

let isChallengeMode = false; let cScore = 0; let cTime = 120; let cTimerObj = null; let studentClass = ''; let studentNum = '';

let cCombo = 0;        // 記錄連擊數
let qStartTime = 0;    // 記錄題目出現的時間，用來算極速加分

window.onload = () => {
    let numHtml = ''; for (let i = 1; i <= 40; i++) numHtml += `<option value="${i}">${i}</option>`;
    document.getElementById('selNum').innerHTML = numHtml;

    renderNumpad('m2', 'border-mod2'); renderNumpad('m3', 'border-mod3');
    renderNumpad('m4', 'border-mod4'); renderNumpad('m5', 'border-mod5'); renderNumpad('m6', 'border-mod6');
    goHome();
};

function renderNumpad(modId, colorClass) {
    const pad = document.getElementById(`${modId}-numpad`); if (!pad) return;
    let html = '';
    for (let i = 1; i <= 9; i++) html += `<button onclick="${modId}Type('${i}')" class="numpad-btn ${colorClass}">${i}</button>`;
    html += `<button onclick="${modId}Type('.')" class="numpad-btn ${colorClass} text-2xl font-black">.</button>`;
    html += `<button onclick="${modId}Type('0')" class="numpad-btn ${colorClass}">0</button>`;
    html += `<button onclick="${modId}Del()" class="numpad-btn bg-red-50 text-red-600 border-red-200 flex justify-center items-center text-3xl">⌫</button>`;
    pad.innerHTML = html;
}

function hideAllScreens() { Object.values(screens).forEach(id => document.getElementById(id).classList.add('hidden')); }

function goHome() {
    isChallengeMode = false; clearInterval(cTimerObj);
    document.getElementById('statsBar').classList.add('hidden'); document.getElementById('challengeBar').classList.add('hidden');
    document.getElementById('headerTitle').innerText = '科學量度大挑戰'; document.getElementById('navHomeBtn').classList.remove('hidden');
    hideAllScreens(); document.getElementById(screens.home).classList.remove('hidden'); closeHint();
}

function startPractice(mod) {
    isChallengeMode = false; currentModule = mod; stats = { correct: 0, wrong: 0 }; updateStatsUI();
    document.getElementById('statsBar').classList.remove('hidden'); document.getElementById('challengeBar').classList.add('hidden');
    document.getElementById('headerTitle').innerText = modTitles[mod];
    hideAllScreens(); document.getElementById(screens[mod]).classList.remove('hidden');
    initModLogic(mod);
}

function updateStatsUI() { document.getElementById('correctCount').innerText = stats.correct; document.getElementById('wrongCount').innerText = stats.wrong; }
function closeHint() { document.getElementById('hintBox').classList.add('hidden'); }
function showHint(html, isError = false) {
    document.getElementById('hintTitle').innerText = isError ? "❌ 錯誤提示" : "💡 提示";
    document.getElementById('hintTitle').className = isError ? "text-2xl font-bold text-red-600 mb-2" : "text-2xl font-bold text-yellow-800 mb-2";
    document.getElementById('hintText').innerHTML = html; document.getElementById('hintBox').classList.remove('hidden');
}

// --- 統一答題處理架構 (修復 Mod 1 特效問題) ---
// --- 統一答題處理架構 ---
function handleCorrect(btnId, refreshFn) {
    const btn = document.getElementById(btnId);
    const isM1 = btnId.startsWith('m1-btn');

    // 1. 按鈕視覺特效 (變綠)
    if (isM1) {
        btn.classList.remove('bg-white', 'text-indigo-700', 'border-indigo-200');
        btn.classList.add('bg-green-500', 'text-white', 'border-green-600');
    } else {
        btn.classList.add('bg-green-500', 'text-white');
        btn.innerText = "✓ 正確！";
    }

    // 2. 挑戰模式計分 vs 練習模式
    if (isChallengeMode) {
        // 電競計分：極速加分 + 連擊加分
        let timeTaken = (Date.now() - qStartTime) / 1000;
        let speedBonus = Math.max(0, Math.floor(15 - timeTaken));
        cCombo++;
        let comboBonus = Math.min(50, cCombo * 5);
        let earned = 100 + speedBonus + comboBonus;
        cScore += earned;

        if (!isM1) btn.innerText = `✓ +${earned} 分`;
        updateChallengeUI();

        // 800毫秒後自動跳下一題 (挑戰模式)
        setTimeout(nextChallengeMod, 800);
    } else {
        // 練習模式：純記錄對錯
        stats.correct++;
        updateStatsUI();

        // 800毫秒後自動跳下一題 (練習模式)
        setTimeout(() => {
            if (!isM1) {
                // 還原按鈕文字與顏色
                btn.innerText = btnId.includes('m6') ? "提交讀數" : "提交答案";
                btn.classList.remove('bg-green-500', 'text-white');
            } else {
                // 還原難點一的按鈕樣式
                btn.classList.remove('bg-green-500', 'text-white', 'border-green-600');
                btn.classList.add('bg-white', 'text-indigo-700', 'border-indigo-200');
            }

            // 安全呼叫生成下一題的函數
            if (typeof refreshFn === 'function') {
                refreshFn();
            }
        }, 800);
    }
}

function handleWrong(btnId, hintHtml, isError = false) {
    const btn = document.getElementById(btnId);
    const isM1 = btnId.startsWith('m1-btn');

    // 1. 按鈕視覺特效 (震動與變紅)
    btn.classList.add('bg-red-500', 'shake', 'text-white');
    if (isM1) {
        btn.classList.remove('border-indigo-200');
        btn.classList.add('bg-red-200', 'border-red-500', 'text-red-700');
    } else {
        btn.innerText = "❌ 答錯了";
    }

    // 2. 計分與懲罰邏輯
    if (isChallengeMode) {
        cCombo = 0; // 致命懲罰：連擊(Combo) 瞬間歸零！
        cTime = Math.max(0, cTime - 8); // 扣 8 秒時間
        cScore = Math.max(0, cScore - 30); // 倒扣 30 分

        updateChallengeUI();
        showHint(`【懲罰：扣 8 秒並倒扣 30 分】<br>${hintHtml}`, isError);

        // 給予 1.5 秒的緩衝時間讓學生看提示，這段時間不會算進下一題的計時
        qStartTime = Date.now() + 1500;
    } else {
        // 練習模式：只記錄錯題數，不扣分
        stats.wrong++;
        updateStatsUI();
        showHint(hintHtml, isError);
    }

    // 3. 1秒後恢復按鈕原始狀態
    setTimeout(() => {
        if (isM1) {
            btn.classList.remove('bg-red-200', 'border-red-500', 'text-red-700', 'shake', 'bg-red-500', 'text-white');
            btn.classList.add('border-indigo-200');
        } else {
            btn.classList.remove('bg-red-500', 'shake', 'text-white');
            // 判斷是難點6(提交讀數)還是其他難點(提交答案)
            btn.innerText = btnId.includes('m6') ? "提交讀數" : "提交答案";
        }
    }, 1000);
}


// --- 挑戰模式與排行榜邏輯 ---
function showLogin() { hideAllScreens(); document.getElementById('screen-login').classList.remove('hidden'); }
function startChallenge() {
    studentClass = document.getElementById('selClass').value;
    studentNum = document.getElementById('selNum').value;

    // 初始化分數、時間與連擊數
    isChallengeMode = true;
    cScore = 0;
    cTime = 120;
    cCombo = 0;
    updateChallengeUI();

    document.getElementById('navHomeBtn').classList.add('hidden');
    document.getElementById('headerTitle').innerText = `綜合挑戰 (${studentClass}-${studentNum})`;
    document.getElementById('statsBar').classList.add('hidden');
    document.getElementById('challengeBar').classList.remove('hidden');

    cTimerObj = setInterval(() => {
        cTime--;
        updateChallengeUI();
        if (cTime <= 0) { clearInterval(cTimerObj); endChallenge(); }
    }, 1000);

    nextChallengeMod();
}

function updateChallengeUI() {
    const tDisp = document.getElementById('cTimerDisplay'); tDisp.innerText = cTime;
    tDisp.parentElement.className = cTime <= 10 ? 'bg-red-500 text-white px-4 py-1 rounded-full text-lg font-black animate-bounce flex items-center gap-1' : 'bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-lg font-black shadow-inner flex items-center gap-1';
    document.getElementById('cScoreDisplay').innerText = cScore;
}
function nextChallengeMod() {
    closeHint();
    hideAllScreens();
    const mods = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5', 'mod6'];
    const rMod = mods[Math.floor(Math.random() * mods.length)];

    currentModule = rMod;
    document.getElementById(screens[rMod]).classList.remove('hidden');
    initModLogic(rMod);

    // 記錄這題出現的精確毫秒數，用來計算極速加分
    qStartTime = Date.now();
}
function endChallenge() {
    hideAllScreens(); document.getElementById('screen-end').classList.remove('hidden');
    document.getElementById('challengeBar').classList.add('hidden'); document.getElementById('navHomeBtn').classList.remove('hidden');
    document.getElementById('finalScore').innerText = cScore;
    const status = document.getElementById('saveStatus');
    if (isFirebaseReady) {
        status.innerText = "正在上傳分數到排行榜...";
        const docRef = db.collection('leaderboard').doc(`${studentClass}-${studentNum}`);
        docRef.get().then((doc) => {
            if (!doc.exists || cScore > doc.data().score) {
                docRef.set({ class: studentClass, num: parseInt(studentNum), score: cScore, timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => status.innerText = "上傳成功！已刷新最高紀錄！");
            } else { status.innerText = "完成！(未超越之前的最高紀錄)"; }
        }).catch(e => { status.innerText = "上傳失敗，請檢查網路連線。"; console.error(e); });
    } else { status.innerText = "完成！(無法連線至 Firebase)"; }
}
function showLeaderboard() {
    hideAllScreens(); document.getElementById('screen-leaderboard').classList.remove('hidden');
    const tbody = document.getElementById('lbBody'); const loading = document.getElementById('lbLoading');
    tbody.innerHTML = ''; loading.classList.remove('hidden');
    if (isFirebaseReady) {
        db.collection('leaderboard').orderBy('score', 'desc').limit(30).get().then((snapshot) => {
            loading.classList.add('hidden'); let r = 1;
            snapshot.forEach(doc => {
                const d = doc.data();
                tbody.innerHTML += `<tr class="border-b border-indigo-700 hover:bg-indigo-700 transition"><td class="py-3 pl-2 text-yellow-300">#${r}</td><td class="py-3">${d.class} <span class="text-sm text-indigo-300">(${d.num})</span></td><td class="py-3 text-right pr-4 text-green-300">${d.score}</td></tr>`;
                r++;
            });
        }).catch(() => { loading.innerText = "無法載入排行榜資料"; });
    } else { loading.innerText = "尚未連接至資料庫"; }
}
