/* ==========================================================================
   สคริปต์ควบคุมตรรกะเกม Cosmic Animal Odyssey (ธีมกาแลกซี่พาสเทล)
   ========================================================================== */

// 1. กำหนดชนิดของสัตว์อวกาศ (12 ชนิด)
const ANIMALS = [
  { emoji: '🐶', name: 'สุนัขอวกาศ' },
  { emoji: '🐱', name: 'แมวเนบิวลา' },
  { emoji: '🐭', name: 'หนูดาวหาง' },
  { emoji: '🐹', name: 'แฮมสเตอร์ดาวตก' },
  { emoji: '🐰', name: 'กระต่ายดวงจันทร์' },
  { emoji: '🦊', name: 'สุนัขจิ้งจอกสุริยะ' },
  { emoji: '🐻', name: 'หมีดาวเหนือ' },
  { emoji: '🐼', name: 'แพนด้าทางช้างเผือก' },
  { emoji: '🐨', name: 'โคอาล่าคอสมิก' },
  { emoji: '🐯', name: 'เสือดาวพฤหัส' },
  { emoji: '🦁', name: 'สิงโตสุริยคราส' },
  { emoji: '🐮', name: 'วัวพูลโต' }
];

// 2. ตัวแปรสถานะของเกม (Game States)
let cardsData = [];
let flippedCards = [];
let matchedPairs = 0;
let movesCount = 0;
let scoreCount = 0;
let isBoardLocked = false;
let gameTimer = null;
let secondsElapsed = 0;
let isGameStarted = false;
let isMuted = false;

// ตัวแปรสำหรับ Web Audio API (สร้างแบบ Lazy Load)
let audioCtx = null;

// 3. อ้างอิง DOM Elements
const startScreen = document.getElementById('start-screen');
const playScreen = document.getElementById('play-screen');
const victoryModal = document.getElementById('victory-modal');
const gameGrid = document.getElementById('game-grid');

const scoreVal = document.getElementById('score-val');
const timerVal = document.getElementById('timer-val');
const movesVal = document.getElementById('moves-val');
const bestStats = document.getElementById('best-stats');

const btnStartGame = document.getElementById('btn-start-game');
const btnSoundToggle = document.getElementById('btn-sound-toggle');
const btnResetGame = document.getElementById('btn-reset-game');
const btnBackHome = document.getElementById('btn-back-home');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnHomeVictory = document.getElementById('btn-home-victory');

const finalTime = document.getElementById('final-time');
const finalMoves = document.getElementById('final-moves');
const finalScore = document.getElementById('final-score');
const starsRating = document.getElementById('stars-rating');
const newRecordBanner = document.getElementById('new-record-banner');
const starsContainer = document.getElementById('stars-container');

// ==========================================================================
// ส่วนที่ 1: การเตรียมฉากหลังดวงดาวกะพริบ (Galaxy Stars Initializer)
// ==========================================================================
function initBackgroundStars() {
  starsContainer.innerHTML = '';
  const starCount = window.innerWidth < 768 ? 40 : 80;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'space-star';
    
    // สุ่มตำแหน่งและขนาด
    const size = Math.random() * 3 + 1; // 1px ถึง 4px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    
    // สุ่มเวลาในการกะพริบ
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    
    starsContainer.appendChild(star);
  }
}

// โหลดดวงดาวตอนเริ่มต้นและอัปเดตเมื่อขยายหน้าจอ
window.addEventListener('load', initBackgroundStars);
window.addEventListener('resize', initBackgroundStars);

// ==========================================================================
// ส่วนที่ 2: ระบบเสียงสังเคราะห์ด้วย Web Audio API (Synthesizer Sfx)
// ==========================================================================
function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // หากบราว์เซอร์บล็อกเสียงไว้ ให้ปลดล็อก
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("ไม่สามารถเรียกใช้ Web Audio API ได้: ", e);
  }
}

// ฟังก์ชันสร้างเสียงแบบ Beep/Chime
function playSynthSound(freqs, type, duration, slide = false) {
  if (isMuted) return;
  try {
    initAudio();
    if (!audioCtx) return;
  } catch (e) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
  
  // ตั้งค่าความถี่หลัก
  osc.frequency.setValueAtTime(freqs[0], audioCtx.currentTime);
  
  if (slide && freqs.length > 1) {
    // เอฟเฟกต์รูดเสียงขึ้นหรือลง
    osc.frequency.exponentialRampToValueAtTime(freqs[1], audioCtx.currentTime + duration);
  } else if (freqs.length > 1) {
    // การเล่นโน้ตต่อเนื่องแบบ Arpeggio
    let stepTime = duration / freqs.length;
    for (let i = 1; i < freqs.length; i++) {
      osc.frequency.setValueAtTime(freqs[i], audioCtx.currentTime + (i * stepTime));
    }
  }

  // กำหนดระดับความดังและเสียงเฟดออก (ADSR Envelope แบบง่าย)
  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// เสียงพลิกการ์ด (เสียงสั้นๆ เบาๆ)
function playFlipSound() {
  playSynthSound([350, 480], 'triangle', 0.1, true);
}

// เสียงเมื่อจับคู่ถูก (เสียงหวานๆ โน้ตสูงคู่อินเตอร์วัล)
function playMatchSound() {
  playSynthSound([523.25, 659.25, 783.99, 1046.5], 'sine', 0.35, false); // โน้ต C5 -> E5 -> G5 -> C6
}

// เสียงเมื่อจับคู่ผิด (เสียงโทนทุ้มสไลด์ต่ำลง)
function playMismatchSound() {
  playSynthSound([220, 140], 'sawtooth', 0.22, true);
}

// เสียงเมื่อชนะเกม (เสียงดนตรีเฉลิมฉลองสไตล์อวกาศ)
function playWinSound() {
  const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
  let timeGap = 0.12;
  
  melody.forEach((freq, idx) => {
    setTimeout(() => {
      if (isMuted) return;
      playSynthSound([freq], 'sine', 0.4, false);
    }, idx * timeGap * 1000);
  });
}

// จัดการปุ่มเปิด/ปิดเสียง
function toggleSound() {
  isMuted = !isMuted;
  localStorage.setItem('cosmic_game_muted', isMuted ? 'true' : 'false');
  updateSoundButtonUI();
}

function updateSoundButtonUI() {
  if (isMuted) {
    btnSoundToggle.innerHTML = '<span class="icon">🔇</span>';
    btnSoundToggle.classList.add('muted');
  } else {
    btnSoundToggle.innerHTML = '<span class="icon">🔊</span>';
    btnSoundToggle.classList.remove('muted');
  }
}

// โหลดสถานะการตั้งค่าเสียง
if (localStorage.getItem('cosmic_game_muted') === 'true') {
  isMuted = true;
}

// ==========================================================================
// ส่วนที่ 3: ตรรกะของเกมจับคู่การ์ด (Core Game Logic)
// ==========================================================================

// โหลดข้อมูลสถิติดีที่สุดจาก LocalStorage
function updateBestStatsUI() {
  const bestScore = localStorage.getItem('cosmic_best_score');
  const bestTime = localStorage.getItem('cosmic_best_time');
  const bestMoves = localStorage.getItem('cosmic_best_moves');

  if (bestScore && bestTime && bestMoves) {
    bestStats.innerHTML = `<br>🌟 คะแนน: <b class="font-outfit">${bestScore}</b> | ⏱️ เวลา: <b class="font-outfit">${formatTime(bestTime)}</b> | 🔄 เปิด: <b class="font-outfit">${bestMoves} ครั้ง</b>`;
  } else {
    bestStats.innerText = 'ยังไม่มีประวัติการบันทึก';
  }
}

// สลับการ์ดด้วย Fisher-Yates Algorithm
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// ฟอร์แมตเวลาจากวินาทีเป็น mm:ss
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// เริ่มต้นตัวจับเวลา (Timer)
function startTimer() {
  if (gameTimer) clearInterval(gameTimer);
  secondsElapsed = 0;
  timerVal.innerText = '00:00';
  gameTimer = setInterval(() => {
    secondsElapsed++;
    timerVal.innerText = formatTime(secondsElapsed);
  }, 1000);
}

// หยุดจับเวลา
function stopTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

// สร้างประกายละอองดาวรอบการ์ดที่จับคู่สำเร็จ (Sparkle Particles)
function createMatchSparkles(cardElement) {
  const rect = cardElement.getBoundingClientRect();
  const cardCenterX = rect.left + rect.width / 2 + window.scrollX;
  const cardCenterY = rect.top + rect.height / 2 + window.scrollY;
  
  const particles = ['✨', '⭐', '💫', '🌟', '☄️'];
  const particleCount = 10;
  
  for (let i = 0; i < particleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'match-sparkle';
    sparkle.innerText = particles[Math.floor(Math.random() * particles.length)];
    
    // วางไว้จุดศูนย์กลางการ์ด
    sparkle.style.left = `${cardCenterX}px`;
    sparkle.style.top = `${cardCenterY}px`;
    
    // คำนวณรัศมีการบินกระจาย (random angle and distance)
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 40; // บินออกไป 40px ถึง 120px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    // ส่งค่าไปยัง CSS Custom Properties สำหรับการสร้างคีย์เฟรมแอนิเมชัน
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(sparkle);
    
    // ลบองค์ประกอบเมื่อแอนิเมชันจบลง
    sparkle.addEventListener('animationend', () => {
      sparkle.remove();
    });
  }
}

// สร้างกระดานการ์ดใน DOM
function renderBoard() {
  gameGrid.innerHTML = '';
  
  // สลับการ์ดทั้งหมด 24 ใบ
  cardsData = [];
  // โคลนอาร์เรย์สัตว์เพื่อให้ได้ 12 คู่ (24 การ์ด)
  const pairedAnimals = [...ANIMALS, ...ANIMALS];
  shuffle(pairedAnimals);

  pairedAnimals.forEach((animal, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.id = animal.emoji; // ใช้ emoji เป็นตัวจำแนกคู่แท้

    card.innerHTML = `
      <div class="card-face card-back"></div>
      <div class="card-face card-front">${animal.emoji}</div>
    `;

    card.addEventListener('click', () => handleCardClick(card));
    gameGrid.appendChild(card);
  });
}

// จัดการเมื่อคลิกเลือกการ์ด
function handleCardClick(card) {
  // เงื่อนไขในการคลิกไม่ได้: บอร์ดล็อก, การ์ดพลิกอยู่แล้ว, หรือการ์ดจับคู่ได้แล้ว
  if (isBoardLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
    return;
  }

  // เริ่มต้นเปิดระบบเสียงในครั้งแรกที่มีการคลิก (ความปลอดภัยของนโยบายบราวเซอร์)
  try {
    initAudio();
    playFlipSound();
  } catch (e) {
    console.warn("ไม่สามารถเล่นเสียงการพลิกการ์ดได้: ", e);
  }

  // พลิกการ์ดใบนี้
  card.classList.add('flipped');
  flippedCards.push(card);

  // เริ่มจับเวลาในการคลิกการ์ดใบแรก
  if (!isGameStarted) {
    isGameStarted = true;
    startTimer();
  }

  // หากพลิกครบ 2 ใบในตานั้น ให้ทำการตรวจจับคู่
  if (flippedCards.length === 2) {
    movesCount++;
    movesVal.innerText = movesCount;
    checkMatch();
  }
}

// ตรวจสอบการจับคู่การ์ดสองใบ
function checkMatch() {
  isBoardLocked = true;
  const [card1, card2] = flippedCards;

  const isMatched = card1.dataset.id === card2.dataset.id;

  if (isMatched) {
    // กรณีจับคู่ถูกต้อง
    setTimeout(() => {
      playMatchSound();
      
      card1.classList.add('matched');
      card2.classList.add('matched');
      
      // ลบความสามารถในการพลิกและค้างหน้าหน้ากากการ์ด
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      
      // สร้างเอฟเฟกต์กระจายดาว
      createMatchSparkles(card1);
      createMatchSparkles(card2);
      
      // คำนวณคะแนน: เพิ่ม 100 คะแนนต่อคู่
      scoreCount += 100;
      scoreVal.innerText = scoreCount;
      
      matchedPairs++;
      flippedCards = [];
      isBoardLocked = false;
      
      // ตรวจสอบเงื่อนไขการชนะเกม (จับคู่ครบ 12 คู่)
      if (matchedPairs === ANIMALS.length) {
        handleVictory();
      }
    }, 450); // ดีเลย์เล็กน้อยให้มองเห็นการเปิดการ์ดก่อน
  } else {
    // กรณีจับคู่ผิด
    setTimeout(() => {
      playMismatchSound();
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      
      // หักคะแนนเล็กน้อยหากตอบผิดเพื่อเพิ่มความตื่นเต้น (คะแนนขั้นต่ำ 0)
      scoreCount = Math.max(0, scoreCount - 10);
      scoreVal.innerText = scoreCount;

      flippedCards = [];
      isBoardLocked = false;
    }, 1100); // พลิกการ์ดกลับหลัง 1.1 วินาที
  }
}

// สั่งล้างข้อมูลเพื่อเริ่มเล่นใหม่
function resetGame() {
  stopTimer();
  matchedPairs = 0;
  movesCount = 0;
  scoreCount = 0;
  flippedCards = [];
  isBoardLocked = false;
  isGameStarted = false;
  
  movesVal.innerText = '0';
  scoreVal.innerText = '0';
  timerVal.innerText = '00:00';
  
  renderBoard();
}

// จัดการเมื่อชนะเกม (Show Victory Screen)
function handleVictory() {
  stopTimer();
  playWinSound();

  // 1. นำข้อมูลสถิติไปกรอกใส่หน้าต่างชัยชนะ
  finalTime.innerText = formatTime(secondsElapsed);
  finalMoves.innerText = `${movesCount} ครั้ง`;
  finalScore.innerText = scoreCount;

  // 2. คำนวณเกรดดาว
  const starElements = starsRating.querySelectorAll('span');
  starElements.forEach(s => s.classList.remove('filled'));
  
  let starsWon = 1;
  if (movesCount <= 16) {
    starsWon = 3;
  } else if (movesCount <= 24) {
    starsWon = 2;
  }

  // เพิ่มดาวทีละดวงแบบมีดีเลย์ให้ดูมีลูกเล่น
  for (let i = 0; i < starsWon; i++) {
    setTimeout(() => {
      starElements[i].classList.add('filled');
    }, (i + 1) * 300);
  }

  // 3. ตรวจสอบและอัปเดตสถิติดีที่สุด (Best Record)
  const currentBestScore = localStorage.getItem('cosmic_best_score');
  let isNewRecord = false;

  if (!currentBestScore) {
    isNewRecord = true;
  } else {
    // เทียบจากคะแนน หากคะแนนเยอะกว่า ถือว่าทุบสถิติ
    // หากคะแนนเท่ากัน ให้ดูที่ความเร็ว (เวลาที่ใช้น้อยกว่า)
    const bestScoreInt = parseInt(currentBestScore);
    const bestTimeInt = parseInt(localStorage.getItem('cosmic_best_time'));
    
    if (scoreCount > bestScoreInt) {
      isNewRecord = true;
    } else if (scoreCount === bestScoreInt && secondsElapsed < bestTimeInt) {
      isNewRecord = true;
    }
  }

  if (isNewRecord) {
    localStorage.setItem('cosmic_best_score', scoreCount.toString());
    localStorage.setItem('cosmic_best_time', secondsElapsed.toString());
    localStorage.setItem('cosmic_best_moves', movesCount.toString());
    newRecordBanner.style.display = 'block';
  } else {
    newRecordBanner.style.display = 'none';
  }

  updateBestStatsUI();

  // 4. แสดงผลป๊อปอัป
  setTimeout(() => {
    victoryModal.classList.add('active');
  }, 800);
}

// เปลี่ยนสลับหน้าจอแสดงผล
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  victoryModal.classList.remove('active');
  
  if (screenId === 'start') {
    startScreen.classList.add('active');
    updateBestStatsUI();
  } else if (screenId === 'play') {
    playScreen.classList.add('active');
    resetGame();
  }
}

// ==========================================================================
// ส่วนที่ 4: การลงทะเบียนปุ่มกดและการเรียกใช้เริ่มต้น (Event Listeners)
// ==========================================================================

btnStartGame.addEventListener('click', () => navigateTo('play'));
btnResetGame.addEventListener('click', resetGame);
btnBackHome.addEventListener('click', () => {
  if (confirm('คุณต้องการออกจากภารกิจและกลับหน้าแรกใช่หรือไม่?')) {
    stopTimer();
    navigateTo('start');
  }
});

btnPlayAgain.addEventListener('click', () => {
  victoryModal.classList.remove('active');
  resetGame();
});

btnHomeVictory.addEventListener('click', () => {
  victoryModal.classList.remove('active');
  navigateTo('start');
});

btnSoundToggle.addEventListener('click', toggleSound);

// รันหน้าจอเริ่มเกมตอนต้น
updateSoundButtonUI();
navigateTo('start');
