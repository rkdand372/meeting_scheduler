// 🔥 Firebase import (반드시 맨 위)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 room id 가져오기
const params = new URLSearchParams(window.location.search);
let roomId = params.get("room");

// 없으면 새로 생성
if (!roomId) {
  roomId = Math.random().toString(36).substring(2, 8);
  window.location.search = `?room=${roomId}`;
}

// 🔥 Firebase 설정 (네 거 그대로 넣기)
const firebaseConfig = {
  apiKey: "AIzaSyAZR277ngNy2xgBBHLTp9aQs6AEyGXYYnU",
  authDomain: "meeting-scheduler-3f30e.firebaseapp.com",
  projectId: "meeting-scheduler-3f30e",
  storageBucket: "meeting-scheduler-3f30e.firebasestorage.app",
  messagingSenderId: "159393450808",
  appId: "1:159393450808:web:b19d136900df08f4830fcd"
};

// 🔥 Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 Firestore 문서 (공용 데이터)
const docRef = doc(db, "schedules", roomId);

// 🔥 DOM 요소
const calendar = document.getElementById("calendar");
const modal = document.getElementById("modal");
const selectedDateText = document.getElementById("selectedDate");
const timeGrid = document.getElementById("timeGrid");
const saveBtn = document.getElementById("saveBtn");

let userName = localStorage.getItem("username") || "";
let currentDate = "";
let selectedTimes = [];
let data = {}; // 전체 데이터

const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const nameSaveBtn = document.getElementById("nameSaveBtn");

// 이미 이름 있으면 바로 시작
if (userName) {
  nameModal.style.display = "none";
}

// 저장 버튼
nameSaveBtn.onclick = () => {
  userName = nameInput.value.trim();

  if (!userName) {
    alert("이름 입력해줘");
    return;
  }

  localStorage.setItem("username", userName);
  nameModal.style.display = "none";
};

// 🔥 실시간 데이터 받기
onSnapshot(docRef, (docSnap) => {
  if (docSnap.exists()) {
    data = docSnap.data();
  } else {
    data = {};
  }
  console.log("🔥 업데이트됨:", data);

  updateCalendarColors();
  highlightBestDays();
});

// 🔥 달력 생성
for (let i = 1; i <= 31; i++) {
  const day = document.createElement("div");
  day.className = "day";
  day.innerText = i;

  day.onclick = () => openModal(i);

  calendar.appendChild(day);
}

// 🔥 팝업 열기
function openModal(day) {
  if (!userName) {
    alert("이름 먼저 입력해줘");
    return;
  }
  currentDate = `2026-05-${day}`;
  selectedDateText.innerText = currentDate;

  modal.style.display = "flex";
  timeGrid.innerHTML = "";

  selectedTimes = (data[currentDate] && data[currentDate][userName]) || [];
  const dateData = data[currentDate];
  const overlapCount = getOverlapTimes(dateData);

  // 시간 생성
  for (let i = 9; i <= 23; i++) {
    const time = document.createElement("div");
    time.className = "time";
    time.innerText = `${i}:00`;

    // 내가 선택한 시간
 if (selectedTimes.includes(i)) {
  time.classList.add("selected");
 }

// 🔥 겹치는 정도 표시 (핵심)
 if (overlapCount[i]) {
  time.style.background = getColor(overlapCount[i]);
  time.innerText = `${i}:00 (${overlapCount[i]}명)`;
 }

    time.onclick = () => {
      time.classList.toggle("selected");

      if (selectedTimes.includes(i)) {
        selectedTimes = selectedTimes.filter(t => t !== i);
      } else {
        selectedTimes.push(i);
      }
    };

    timeGrid.appendChild(time);
  }
}

// 🔥 저장 (Firebase에)
saveBtn.onclick = async (e) => {
  e.stopPropagation();

  console.log("🔥 저장 버튼 클릭됨");

  if (!userName) {
    alert("이름 먼저 입력해줘");
    return;
  }

  if (!data[currentDate]) {
    data[currentDate] = {};
  }

  data[currentDate][userName] = selectedTimes;

  try {
    await setDoc(docRef, data);
    modal.style.display = "none";
  } catch (err) {
    console.error("저장 실패:", err);
    alert("저장 실패");
  }
};
//팝업닫기
function closeModal() {
  modal.style.display = "none";
}

const modalContent = document.querySelector("#modal .modal-content");

if (modalContent) {
  modalContent.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function getOverlapTimes(dateData) {
  if (!dateData) return {};

  const count = {};

  // 사람별 시간 돌기
  Object.values(dateData).forEach(times => {
    times.forEach(t => {
      count[t] = (count[t] || 0) + 1;
    });
  });

  return count;
}

//getColor 컬러기능
function getColor(count) {
  if (count === 0) return "#ebedf0"; // 회색
  if (count === 1) return "#c6e48b";
  if (count === 2) return "#7bc96f";
  if (count === 3) return "#239a3b";
  return "#196127";
}

function getMaxOverlap(dateData) {
  if (!dateData) return 0;

  const count = {};

  Object.values(dateData).forEach(times => {
    times.forEach(t => {
      count[t] = (count[t] || 0) + 1;
    });
  });

  return Math.max(0, ...Object.values(count));
}

function updateCalendarColors() {
  const days = document.querySelectorAll(".day");

  days.forEach((dayEl, index) => {
    const day = index + 1;
    const dateKey = `2026-05-${day}`;
    const dateData = data[dateKey];

    const max = getMaxOverlap(dateData);

    dayEl.style.background = getColor(max);
  });
}

function highlightBestDays() {
  const days = document.querySelectorAll(".day");

  let maxOverall = 0;
  const dayScores = [];

  // 각 날짜 점수 계산
  days.forEach((dayEl, index) => {
    const day = index + 1;
    const dateKey = `2026-05-${day}`;
    const dateData = data[dateKey];

    const score = getMaxOverlap(dateData);
    dayScores.push(score);

    if (score > maxOverall) {
      maxOverall = score;
    }
  });

  // 최고 점수 날짜 강조
  days.forEach((dayEl, index) => {
    const score = dayScores[index];

    // 기존 테두리 제거
    dayEl.style.outline = "none";

    if (score === maxOverall && score > 0) {
      dayEl.style.outline = "3px solid gold";
    }
  });
}

const shareBtn = document.getElementById("shareBtn");

if (shareBtn) {
  shareBtn.onclick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("링크가 복사되었습니다.");
  };
}

console.log("JS 로딩됨");
console.log(saveBtn);
document.querySelector("#modal .modal-content").addEventListener("click", (e) => {
  e.stopPropagation();
});

modal.addEventListener("click", (e) => {
  e.stopPropagation();
});