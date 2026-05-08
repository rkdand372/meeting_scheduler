const calendarGrid = document.querySelector("#calendarGrid");
const nameModal = document.querySelector("#nameModal");
const nameInput = document.querySelector("#nameInput");
const nameStartBtn = document.querySelector("#nameStartBtn");
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

const data = {
  userName: "",
  selections: {},
};

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

let selectedDay = null;
let selectedTimeValues = [];
let isEditing = false;

const calendarRows = [
  { label: "4/28", dates: [28, 29, 30, 1, 2, 3, 4], monthOffset: [-1, -1, -1, 0, 0, 0, 0] },
  { label: "5/5", dates: [5, 6, 7, 8, 9, 10, 11], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/12", dates: [12, 13, 14, 15, 16, 17, 18], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/19", dates: [19, 20, 21, 22, 23, 24, 25], monthOffset: [0, 0, 0, 0, 0, 0, 0] },
  { label: "5/26", dates: [26, 27, 28, 29, 30, 31, 1], monthOffset: [0, 0, 0, 0, 0, 0, 1] },
  { label: "6/2", dates: [2, 3, 4, 5, 6, 7, 8], monthOffset: [1, 1, 1, 1, 1, 1, 1] },
];

function getDateKey(day) {
  return `2024-05-${String(day).padStart(2, "0")}`;
}

function getDateLabel(day) {
  const dayOfWeek = weekdays[new Date(2024, 4, day).getDay()];

  return `5월 ${day}일 (${dayOfWeek})`;
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  calendarRows.forEach((row) => {
    const label = document.createElement("div");
    label.className = "week-label";
    label.textContent = row.label;
    calendarGrid.appendChild(label);

    row.dates.forEach((date, index) => {
      const isCurrentMonth = row.monthOffset[index] === 0;
      const dateKey = getDateKey(date);
      const hasSavedSelection = Boolean(data.selections[dateKey]?.length);
      const button = document.createElement("button");

      button.type = "button";
      button.className = [
        "day-cell",
        isCurrentMonth && hasSavedSelection ? "level-3" : "",
        !isCurrentMonth ? "is-muted" : "",
        isCurrentMonth && date === selectedDay ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.textContent = date;
      button.disabled = !isCurrentMonth;

      if (isCurrentMonth) {
        button.addEventListener("click", () => handleDateClick(date));
      }

      calendarGrid.appendChild(button);
    });
  });
}

function renderSummary() {
  if (!selectedDay) {
    summaryTitle.textContent = "날짜를 선택해주세요";
    selectedTimes.innerHTML = `<span class="empty-text">시간을 선택하면 여기에 표시돼요.</span>`;
    previewParticipantCount.textContent = "0명";
    return;
  }

  summaryTitle.textContent = getDateLabel(selectedDay);
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
      const day = Number(dateKey.split("-")[2]);
      const chips = data.selections[dateKey].map((time) => `<span class="time-chip">${time}</span>`).join("");

      return `
        <div class="selection-item">
          <div>
            <strong>${getDateLabel(day)}</strong>
            <small>${userName || "내"} 선택</small>
          </div>
          <div class="time-chip-row">${chips}</div>
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
      renderSummary();
    });
    timeGrid.appendChild(button);
  });
}

function previewDate(date) {
  selectedDay = date;
  selectedTimeValues = [...(data.selections[getDateKey(date)] || [])];

  renderCalendar();
  renderSummary();
}

function handleDateClick(date) {
  if (selectedDay === date && !isEditing) {
    openModal(date);
    return;
  }

  previewDate(date);
}

function openModal(date) {
  selectedDay = date;
  selectedTimeValues = [...(data.selections[getDateKey(date)] || [])];
  isEditing = true;

  modalDate.textContent = `2024년 ${getDateLabel(date)}`;
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

  if (restoreSavedSelection && selectedDay) {
    selectedTimeValues = [...(data.selections[getDateKey(selectedDay)] || [])];
    renderSummary();
  }
}

function saveSelection() {
  if (!selectedDay) {
    return;
  }

  const dateKey = getDateKey(selectedDay);

  if (selectedTimeValues.length) {
    data.selections[dateKey] = [...selectedTimeValues];
  } else {
    delete data.selections[dateKey];
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

function startWithName() {
  const enteredName = nameInput.value.trim();

  if (!enteredName) {
    alert("이름을 입력해주세요");
    nameInput.focus();
    return;
  }

  userName = enteredName;
  data.userName = enteredName;
  profileAvatar.textContent = enteredName[0];
  nameModal.classList.add("is-hidden");
}

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

nameStartBtn.addEventListener("click", startWithName);
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startWithName();
  }
});

renderCalendar();
renderSummary();
renderSelectionList();
