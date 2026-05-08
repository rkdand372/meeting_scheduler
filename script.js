const calendarGrid = document.querySelector("#calendarGrid");
const nameModal = document.querySelector("#nameModal");
const nameInput = document.querySelector("#nameInput");
const nameStartBtn = document.querySelector("#nameStartBtn");
const participantList = document.querySelector("#participantList");
const availabilityList = document.querySelector("#availabilityList");
const selectedTimes = document.querySelector("#selectedTimes");
const summaryTitle = document.querySelector("#summaryTitle");
const timeModal = document.querySelector("#timeModal");
const modalDate = document.querySelector("#modalDate");
const timeGrid = document.querySelector("#timeGrid");
const closeModalBtn = document.querySelector("#closeModalBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const saveBtn = document.querySelector("#saveBtn");
const copyLinkBtn = document.querySelector("#copyLinkBtn");
const toast = document.querySelector("#toast");

let userName = "";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const times = [
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

const participants = [
  { name: "김민지", initial: "김", done: true, times: ["14:00", "15:00", "18:00"] },
  { name: "이서준", initial: "이", done: true, times: ["14:00", "15:00", "16:00"] },
  { name: "박도현", initial: "박", done: false, times: ["18:00"] },
];

const availabilityByDate = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 1,
  10: 2,
  11: 1,
  12: 2,
  13: 1,
  14: 1,
  15: 3,
  16: 2,
  17: 3,
  18: 1,
  19: 1,
  20: 2,
  21: 1,
  22: 1,
  23: 3,
  24: 1,
  25: 1,
  26: 1,
  27: 1,
  28: 3,
  29: 2,
  30: 1,
  31: 1,
};

let selectedDay = 15;
let selectedTimeValues = ["14:00", "15:00", "16:00", "18:00"];

const calendarRows = [
  { label: "4/28", dates: [28, 29, 30, 1, 2, 3, 4], monthOffset: [-1, -1, -1, 0, 0, 0, 0] },
  { label: "5/5", dates: [5, 6, 7, 8, 9, 10, 11], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/12", dates: [12, 13, 14, 15, 16, 17, 18], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/19", dates: [19, 20, 21, 22, 23, 24, 25], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/26", dates: [26, 27, 28, 29, 30, 31, 1], monthOffset: [0, 0, 0, 0, 0, 0, 1] },
  { label: "6/2", dates: [2, 3, 4, 5, 6, 7, 8], monthOffset: [1, 1, 1, 1, 1, 1, 1] },
];

function renderCalendar() {
  calendarGrid.innerHTML = "";

  calendarRows.forEach((row) => {
    const label = document.createElement("div");
    label.className = "week-label";
    label.textContent = row.label;
    calendarGrid.appendChild(label);

    row.dates.forEach((date, index) => {
      const isCurrentMonth = row.monthOffset[index] === 0;
      const button = document.createElement("button");
      const level = isCurrentMonth ? availabilityByDate[date] || 0 : 0;

      button.type = "button";
      button.className = [
        "day-cell",
        isCurrentMonth ? `level-${level}` : "is-muted",
        isCurrentMonth && date === selectedDay ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.textContent = date;
      button.disabled = !isCurrentMonth;

      if (isCurrentMonth) {
        button.addEventListener("click", () => openModal(date));
      }

      calendarGrid.appendChild(button);
    });
  });
}

function renderParticipants() {
  participantList.innerHTML = participants
    .map((person) => {
      const statusText = person.done ? `5월 ${selectedDay}일 선택 완료` : "아직 선택하지 않았어요";
      const dotClass = person.done ? "done" : "";

      return `
        <div class="participant-row">
          <div class="avatar">${person.initial}</div>
          <div class="name">${person.name}</div>
          <div class="status"><span class="status-dot ${dotClass}"></span>${statusText}</div>
        </div>
      `;
    })
    .join("");
}

function renderSummary() {
  const dayOfWeek = weekdays[new Date(2024, 4, selectedDay).getDay()];

  summaryTitle.textContent = `5월 ${selectedDay}일 (${dayOfWeek})`;
  selectedTimes.innerHTML = selectedTimeValues.map((time) => `<span class="time-chip">${time}</span>`).join("");
  availabilityList.innerHTML = participants
    .map((person) => {
      const chips = person.times.map((time) => `<span class="time-chip">${time}</span>`).join("");
      return `
        <div class="availability-row">
          <div class="avatar">${person.initial}</div>
          <div class="name">${person.name}</div>
          <div class="chip-list">${chips}</div>
        </div>
      `;
    })
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
      selectedTimeValues = exists
        ? selectedTimeValues.filter((selectedTime) => selectedTime !== time)
        : [...selectedTimeValues, time].sort();
      renderTimeOptions();
    });
    timeGrid.appendChild(button);
  });
}

function openModal(date) {
  selectedDay = date;
  const dayOfWeek = weekdays[new Date(2024, 4, date).getDay()];

  modalDate.textContent = `2024년 5월 ${date}일 (${dayOfWeek})`;
  timeModal.classList.add("is-open");
  timeModal.setAttribute("aria-hidden", "false");
  renderCalendar();
  renderTimeOptions();
}

function closeModal() {
  timeModal.classList.remove("is-open");
  timeModal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
saveBtn.addEventListener("click", () => {
  renderParticipants();
  renderSummary();
  closeModal();
});

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

function startWithName() {
  const enteredName = nameInput.value.trim();

  if (!enteredName) {
    alert("이름을 입력해주세요");
    nameInput.focus();
    return;
  }

  userName = enteredName;
  nameModal.classList.add("is-hidden");
}

nameStartBtn.addEventListener("click", startWithName);
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startWithName();
  }
});

renderCalendar();
renderParticipants();
renderSummary();
