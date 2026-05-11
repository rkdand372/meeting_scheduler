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
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getFirestore,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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
const addRoomBtn = document.querySelector("#addRoomBtn");
const myPageBtn = document.querySelector("#myPageBtn");
const myPageView = document.querySelector("#myPageView");
const schedulerView = document.querySelector("#schedulerView");
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
let activeRoomId = new URLSearchParams(window.location.search).get("room") || "";

const data = {
  userName: "",
  selections: {},
  dateUserCounts: {},
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
      const userCount = data.dateUserCounts[dateKey] || 0;
      const button = document.createElement("button");

      button.type = "button";
      button.className = [
        "day-cell",
        isCurrentMonth ? getCountLevelClass(userCount) : "",
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

function getCountLevelClass(userCount) {
  if (userCount >= 4) {
    return "level-3";
  }

  if (userCount >= 2) {
    return "level-2";
  }

  if (userCount === 1) {
    return "level-1";
  }

  return "";
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

async function loadRoomCalendarData(roomId) {
  data.selections = {};
  data.dateUserCounts = {};
  selectedDateKey = "";
  selectedTimeValues = [];

  const applyScheduleSnapshot = (snapshot) => {
    snapshot.forEach((scheduleDoc) => {
      const schedule = scheduleDoc.data();
      const dateKey = schedule.date || scheduleDoc.id;
      const participants = schedule.participants || {};
      const participantEntries = Object.entries(participants);
      const timesForDate = Array.isArray(schedule.times) ? schedule.times : [];
      const currentUserTimes = currentUser ? participants[currentUser.uid]?.times : null;
      const userCount = participantEntries.length || (timesForDate.length ? 1 : 0);

      if (dateKey && userCount) {
        data.dateUserCounts[dateKey] = Math.max(data.dateUserCounts[dateKey] || 0, userCount);
      }

      if (dateKey && Array.isArray(currentUserTimes) && currentUserTimes.length) {
        data.selections[dateKey] = currentUserTimes;
      } else if (dateKey && timesForDate.length && (!schedule.updatedByUid || schedule.updatedByUid === currentUser?.uid)) {
        data.selections[dateKey] = timesForDate;
      }
    });
  };

  try {
    const schedulesSnapshot = await getDocs(collection(db, "rooms", roomId, "schedules"));

    applyScheduleSnapshot(schedulesSnapshot);
  } catch (error) {
    console.error(error);
  }

  try {
    const topLevelSchedulesQuery = query(collection(db, "schedules"), where("roomId", "==", roomId));
    const topLevelSnapshot = await getDocs(topLevelSchedulesQuery);

    applyScheduleSnapshot(topLevelSnapshot);
  } catch (error) {
    console.error(error);
  }

  renderCalendar();
  renderSummary();
  renderSelectionList();
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

async function saveSelection() {
  if (!selectedDateKey) {
    return;
  }

  if (selectedTimeValues.length) {
    data.selections[selectedDateKey] = [...selectedTimeValues];
  } else {
    delete data.selections[selectedDateKey];
  }

  try {
    if (activeRoomId && currentUser) {
      const scheduleRef = doc(db, "rooms", activeRoomId, "schedules", selectedDateKey);

      if (selectedTimeValues.length) {
        await setDoc(scheduleRef, {
          roomId: activeRoomId,
          date: selectedDateKey,
          participants: {
            [currentUser.uid]: {
              name: currentUser.displayName || currentUser.email || userName || "사용자",
              times: [...selectedTimeValues],
              updatedAt: serverTimestamp(),
            },
          },
          updatedAt: serverTimestamp(),
          updatedByUid: currentUser?.uid || "",
          updatedByName: currentUser?.displayName || currentUser?.email || userName || "사용자",
        }, { merge: true });
      } else {
        await updateDoc(scheduleRef, {
          [`participants.${currentUser.uid}`]: deleteField(),
          updatedAt: serverTimestamp(),
        });

        const scheduleSnapshot = await getDoc(scheduleRef);
        const participants = scheduleSnapshot.data()?.participants || {};

        if (!Object.keys(participants).length) {
          await deleteDoc(scheduleRef);
        }
      }
    }

    if (activeRoomId) {
      await loadRoomCalendarData(activeRoomId);
    }
    renderCalendar();
    renderSummary();
    renderSelectionList();
    closeModal(false);
  } catch (error) {
    console.error(error);
    alert("일정 저장에 실패했어요.");
  }
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
  myPageView.classList.add("is-hidden");
  schedulerView.classList.add("is-hidden");
  authGate.classList.remove("is-hidden");
}

async function showSignedIn(user) {
  currentUser = user;
  userName = user.displayName || user.email || "사용자";
  console.log("로그인 사용자 uid:", user.uid);
  console.log("로그인 사용자 displayName:", user.displayName);
  data.userName = userName;
  signedUserName.textContent = userName;
  myPageName.textContent = userName;
  myPageEmail.textContent = user.email || "";
  profileAvatar.textContent = userName[0];
  authError.textContent = "";
  authGate.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  await loadMyRooms();
  if (activeRoomId) {
    const canEnter = await joinRoomIfAvailable(activeRoomId);

    if (canEnter) {
      await openRoom(activeRoomId, false);
    } else {
      showMyPageView();
    }
  } else {
    showMyPageView();
  }
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
    authError.textContent = `Google 로그인 실패: ${error.code || error.message}`;
    console.error(error);
  }
}

async function logout() {
  await signOut(auth);
}

function showMyPageView() {
  activeRoomId = "";
  data.selections = {};
  data.dateUserCounts = {};
  selectedDateKey = "";
  selectedTimeValues = [];
  const pageUrl = new URL(window.location.href);

  pageUrl.searchParams.delete("room");
  window.history.pushState({}, "", pageUrl.toString());
  renderCalendar();
  renderSummary();
  renderSelectionList();
  myPageView.classList.remove("is-hidden");
  schedulerView.classList.add("is-hidden");
}

function showSchedulerView() {
  myPageView.classList.add("is-hidden");
  schedulerView.classList.remove("is-hidden");
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
      participantUids: [currentUser.uid],
      createdAt: serverTimestamp(),
    });

    showToast("새 모임을 만들었어요");
    loadMyRooms().catch((error) => console.error(error));
    await openRoom(roomId);
  } catch (error) {
    console.error(error);
    alert("모임 생성에 실패했어요. Firestore 설정을 확인해주세요.");
  }
}

function addRoom() {
  const roomId = prompt("추가할 모임의 roomId를 입력해주세요");

  if (!roomId?.trim()) {
    alert("roomId를 입력해주세요");
    return;
  }

  enterRoom(roomId.trim());
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
    await deleteRoomSchedules(roomId);
    await deleteDoc(doc(db, "rooms", roomId));
    showToast("모임을 삭제했어요");
    await loadMyRooms();
  } catch (error) {
    console.error(error);
    alert("모임 삭제에 실패했어요.");
  }
}

async function deleteRoomSchedules(roomId) {
  const batch = writeBatch(db);
  const subcollectionSnapshot = await getDocs(collection(db, "rooms", roomId, "schedules"));
  const topLevelSchedulesQuery = query(collection(db, "schedules"), where("roomId", "==", roomId));
  const topLevelSnapshot = await getDocs(topLevelSchedulesQuery);
  let deleteCount = 0;

  subcollectionSnapshot.forEach((scheduleDoc) => {
    batch.delete(scheduleDoc.ref);
    deleteCount += 1;
  });

  topLevelSnapshot.forEach((scheduleDoc) => {
    batch.delete(scheduleDoc.ref);
    deleteCount += 1;
  });

  if (deleteCount > 0) {
    await batch.commit();
  }
}

async function enterRoom(roomId) {
  const canEnter = await joinRoomIfAvailable(roomId);

  if (canEnter) {
    await openRoom(roomId);
  }
}

async function openRoom(roomId, updateUrl = true) {
  activeRoomId = roomId;

  if (updateUrl) {
    window.history.pushState(null, "", "?room=" + roomId);
  }

  showSchedulerView();
  await loadRoomCalendarData(roomId);
}

async function joinRoomIfAvailable(roomId) {
  if (!currentUser) {
    alert("로그인 후 모임에 입장할 수 있어요.");
    return false;
  }

  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    alert("존재하지 않는 모임이에요.");
    return false;
  }

  const room = roomSnapshot.data();
  const participantUids = Array.isArray(room.participantUids) ? room.participantUids : [];

  if (participantUids.includes(currentUser.uid)) {
    return true;
  }

  if (participantUids.length >= 50) {
    alert("이 모임은 최대 50명까지 참여할 수 있어요");
    return false;
  }

  await updateDoc(roomRef, {
    participantUids: arrayUnion(currentUser.uid),
  });

  return true;
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
addRoomBtn.addEventListener("click", addRoom);
myPageBtn.addEventListener("click", showMyPageView);
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
  if (!activeRoomId) {
    showToast("입장한 모임이 없어요");
    return;
  }

  const roomUrl = new URL(window.location.href);

  roomUrl.searchParams.set("room", activeRoomId);

  try {
    await navigator.clipboard.writeText(roomUrl.toString());
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
