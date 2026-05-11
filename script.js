import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAnalytics,
  isSupported,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZR277ngNy2xgBBHLTp9aQs6AEyGXYYnU",
  authDomain: "meeting-scheduler-3f30e.firebaseapp.com",
  projectId: "meeting-scheduler-3f30e",
  storageBucket: "meeting-scheduler-3f30e.firebasestorage.app",
  messagingSenderId: "159393450808",
  appId: "1:159393450808:web:b19d136900df08f4830fcd",
  measurementId: "G-0JDX0FYJDV",
};

const firebaseApp = initializeApp(firebaseConfig);
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(firebaseApp);
  }
});
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);

const appShell = document.querySelector("#appShell");
const authGate = document.querySelector("#authGate");
const googleLoginBtn = document.querySelector("#googleLoginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const createRoomBtn = document.querySelector("#createRoomBtn");
const signedUserName = document.querySelector("#signedUserName");
const myPageName = document.querySelector("#myPageName");
const myPageEmail = document.querySelector("#myPageEmail");
const roomList = document.querySelector("#roomList");
const authError = document.querySelector("#authError");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarTitle = document.querySelector("#calendarTitle");
const prevMonthBtn = document.querySelector("#prevMonthBtn");
const nextMonthBtn = document.querySelector("#nextMonthBtn");
const selectedTimes = document.querySelector("#selectedTimes");
const summaryTitle = document.querySelector("#summaryTitle");
const previewParticipantCount = document.querySelector("#previewParticipantCount");
const timeModal = document.querySelector("#timeModal");
const modalDate = document.querySelector("#modalDate");
const timeGrid = document.querySelector("#timeGrid");
const closeModalBtn = document.querySelector("#closeModalBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const saveBtn = document.querySelector("#saveBtn");
const copyLinkBtn = document.querySelector("#copyLinkBtn");
const toast = document.querySelector("#toast");
const mySelectionList = document.querySelector("#mySelectionList");
const profileAvatar = document.querySelector("#profileAvatar");

let userName = "";
let currentUser = null;
let myRooms = [];

const data = {
  userName: "",
  selections: {},
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const times = [
  "ALL",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

const today = new Date();
const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const maxMonthOffset = 11;

let displayedMonthOffset = 0;
let selectedDateKey = "";
let selectedTimeValues = [];
let isEditing = false;

function getDisplayedMonth() {
  return new Date(baseMonth.getFullYear(), baseMonth.getMonth() + displayedMonthOffset, 1);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getDateLabel(dateKey) {
  const date = parseDateKey(dateKey);
  const dayOfWeek = weekdays[date.getDay()];

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${dayOfWeek})`;
}

function getMonthLabel(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function getCalendarRows(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) => {
    const weekStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + weekIndex * 7);

    return {
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayIndex);

        return {
          date,
          dateKey: formatDateKey(date),
          isCurrentMonth: date.getMonth() === month,
        };
      }),
    };
  });
}

function updateMonthControls() {
  prevMonthBtn.disabled = displayedMonthOffset === 0;
  nextMonthBtn.disabled = displayedMonthOffset === maxMonthOffset;
}

function renderCalendar() {
  const monthDate = getDisplayedMonth();

  calendarTitle.textContent = getMonthLabel(monthDate);
  calendarGrid.setAttribute("aria-label", `${getMonthLabel(monthDate)} 달력`);
  calendarGrid.innerHTML = "";

  getCalendarRows(monthDate).forEach((row) => {
    const label = document.createElement("div");
    label.className = "week-label";
    label.textContent = row.label;
    calendarGrid.appendChild(label);

    row.days.forEach(({ date, dateKey, isCurrentMonth }) => {
      const hasSavedSelection = Boolean(data.selections[dateKey]?.length);
      const button = document.createElement("button");

      button.type = "button";
      button.className = [
        "day-cell",
        isCurrentMonth && hasSavedSelection ? "level-3" : "",
        !isCurrentMonth ? "is-muted" : "",
        dateKey === selectedDateKey ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.textContent = date.getDate();

      if (isCurrentMonth) {
        button.addEventListener("click", () => handleDateClick(dateKey));
      } else {
        button.disabled = true;
      }

      calendarGrid.appendChild(button);
    });
  });

  updateMonthControls();
}

function renderSummary() {
  if (!selectedDateKey) {
    summaryTitle.textContent = "날짜를 선택해주세요";
    selectedTimes.innerHTML = `<span class="empty-text">시간을 선택하면 여기에 표시돼요.</span>`;
    previewParticipantCount.textContent = "0명";
    return;
  }

  summaryTitle.textContent = getDateLabel(selectedDateKey);
  selectedTimes.innerHTML = selectedTimeValues.length
    ? selectedTimeValues.map((time) => `<span class="time-chip">${time}</span>`).join("")
    : `<span class="empty-text">선택한 시간이 없어요.</span>`;
  previewParticipantCount.textContent = selectedTimeValues.length ? "1명" : "0명";
}

function renderSelectionList() {
  const savedDates = Object.keys(data.selections).sort();

  if (!savedDates.length) {
    mySelectionList.innerHTML = `<p class="empty-text">아직 저장된 선택 결과가 없어요.</p>`;
    return;
  }

  mySelectionList.innerHTML = savedDates
    .map((dateKey) => {
      const chips = data.selections[dateKey].map((time) => `<span class="time-chip">${time}</span>`).join("");

      return `
        <div class="selection-item">
          <div>
            <strong>${getDateLabel(dateKey)}</strong>
            <small>${userName || "내"} 선택</small>
          </div>
          <div class="time-chip-row">${chips}</div>
        </div>
      `;
    })
    .join("");
}

function renderRoomList() {
  if (!myRooms.length) {
    roomList.innerHTML = `<p class="empty-text">아직 만든 모임이 없어요.</p>`;
    return;
  }

  roomList.innerHTML = myRooms
    .map(
      (room) => `
        <article class="room-card">
          <strong>${room.title}</strong>
          <div class="room-actions">
            <button class="secondary-button" type="button" data-room-enter="${room.roomId}">입장</button>
            <button class="danger-button" type="button" data-room-delete="${room.roomId}">삭제</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTimeOptions() {
  timeGrid.innerHTML = "";

  times.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `time-option ${selectedTimeValues.includes(time) ? "is-active" : ""}`;
    button.textContent = time;
    button.addEventListener("click", () => {
      const exists = selectedTimeValues.includes(time);

      if (time === "ALL") {
        selectedTimeValues = exists ? [] : ["ALL"];
      } else {
        selectedTimeValues = exists
          ? selectedTimeValues.filter((selectedTime) => selectedTime !== time)
          : [...selectedTimeValues.filter((selectedTime) => selectedTime !== "ALL"), time].sort();
      }

      renderTimeOptions();
      renderSummary();
    });
    timeGrid.appendChild(button);
  });
}

function previewDate(dateKey) {
  selectedDateKey = dateKey;
  selectedTimeValues = [...(data.selections[dateKey] || [])];

  renderCalendar();
  renderSummary();
}

function handleDateClick(dateKey) {
  if (selectedDateKey === dateKey && !isEditing) {
    openModal(dateKey);
    return;
  }

  previewDate(dateKey);
}

function openModal(dateKey) {
  selectedDateKey = dateKey;
  selectedTimeValues = [...(data.selections[dateKey] || [])];
  isEditing = true;

  modalDate.textContent = getDateLabel(dateKey);
  timeModal.classList.add("is-open");
  timeModal.setAttribute("aria-hidden", "false");
  renderCalendar();
  renderSummary();
  renderTimeOptions();
}

function closeModal(restoreSavedSelection = true) {
  timeModal.classList.remove("is-open");
  timeModal.setAttribute("aria-hidden", "true");
  isEditing = false;

  if (restoreSavedSelection && selectedDateKey) {
    selectedTimeValues = [...(data.selections[selectedDateKey] || [])];
    renderSummary();
  }
}

function saveSelection() {
  if (!selectedDateKey) {
    return;
  }

  if (selectedTimeValues.length) {
    data.selections[selectedDateKey] = [...selectedTimeValues];
  } else {
    delete data.selections[selectedDateKey];
  }

  renderCalendar();
  renderSummary();
  renderSelectionList();
  closeModal(false);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function hasFirebaseConfig() {
  return !Object.values(firebaseConfig).some((value) => value.startsWith("YOUR_"));
}

function showSignedOut() {
  currentUser = null;
  myRooms = [];
  renderRoomList();
  appShell.classList.add("is-hidden");
  authGate.classList.remove("is-hidden");
}

async function showSignedIn(user) {
  currentUser = user;
  userName = user.displayName || user.email || "사용자";
  data.userName = userName;
  signedUserName.textContent = userName;
  myPageName.textContent = userName;
  myPageEmail.textContent = user.email || "";
  profileAvatar.textContent = userName[0];
  authError.textContent = "";
  authGate.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  await loadMyRooms();
}

async function loginWithGoogle() {
  authError.textContent = "";

  if (!hasFirebaseConfig()) {
    authError.textContent = "script.js의 firebaseConfig 값을 먼저 입력해주세요.";
    return;
  }

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    authError.textContent = "Google 로그인에 실패했어요. Firebase 설정을 확인해주세요.";
    console.error(error);
  }
}

async function logout() {
  await signOut(auth);
}

async function createRoom() {
  if (!currentUser) {
    alert("로그인 후 모임을 만들 수 있어요.");
    return;
  }

  const title = prompt("모임 이름을 입력해주세요");

  if (!title?.trim()) {
    alert("모임 이름을 입력해주세요");
    return;
  }

  try {
    const roomRef = doc(collection(db, "rooms"));
    const roomId = roomRef.id;

    await setDoc(roomRef, {
      roomId,
      title: title.trim(),
      ownerUid: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email || "사용자",
      createdAt: serverTimestamp(),
    });

    showToast("새 모임을 만들었어요");
    await loadMyRooms();
  } catch (error) {
    console.error(error);
    alert("모임 생성에 실패했어요. Firestore 설정을 확인해주세요.");
  }
}

async function loadMyRooms() {
  if (!currentUser) {
    myRooms = [];
    renderRoomList();
    return;
  }

  try {
    const roomsQuery = query(collection(db, "rooms"), where("ownerUid", "==", currentUser.uid));
    const snapshot = await getDocs(roomsQuery);

    myRooms = snapshot.docs
      .map((roomDoc) => ({ id: roomDoc.id, ...roomDoc.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderRoomList();
  } catch (error) {
    console.error(error);
    roomList.innerHTML = `<p class="empty-text">모임 목록을 불러오지 못했어요.</p>`;
  }
}

async function deleteRoom(roomId) {
  if (!confirm("이 모임을 삭제할까요?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "rooms", roomId));
    showToast("모임을 삭제했어요");
    await loadMyRooms();
  } catch (error) {
    console.error(error);
    alert("모임 삭제에 실패했어요.");
  }
}

function enterRoom(roomId) {
  const roomUrl = new URL(window.location.href);

  roomUrl.searchParams.set("room", roomId);
  window.location.href = roomUrl.toString();
}

function moveMonth(direction) {
  const nextOffset = displayedMonthOffset + direction;

  if (nextOffset < 0 || nextOffset > maxMonthOffset) {
    return;
  }

  displayedMonthOffset = nextOffset;
  renderCalendar();
}

googleLoginBtn.addEventListener("click", loginWithGoogle);
logoutBtn.addEventListener("click", logout);
createRoomBtn.addEventListener("click", createRoom);
prevMonthBtn.addEventListener("click", () => moveMonth(-1));
nextMonthBtn.addEventListener("click", () => moveMonth(1));
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
saveBtn.addEventListener("click", saveSelection);

timeModal.addEventListener("click", (event) => {
  if (event.target === timeModal) {
    closeModal();
  }
});

copyLinkBtn.addEventListener("click", async () => {
  const link = window.location.href;

  try {
    await navigator.clipboard.writeText(link);
    showToast("초대 링크를 복사했어요");
  } catch {
    showToast("현재 주소를 복사해 초대할 수 있어요");
  }
});

roomList.addEventListener("click", (event) => {
  const enterButton = event.target.closest("[data-room-enter]");
  const deleteButton = event.target.closest("[data-room-delete]");

  if (enterButton) {
    enterRoom(enterButton.dataset.roomEnter);
  }

  if (deleteButton) {
    deleteRoom(deleteButton.dataset.roomDelete);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showSignedIn(user);
  } else {
    showSignedOut();
  }
});

renderCalendar();
renderSummary();
renderSelectionList();
