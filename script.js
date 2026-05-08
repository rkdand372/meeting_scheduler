const calendarGrid = document.querySelector("#calendarGrid");
const calendarTitle = document.querySelector("#calendarTitle");
const prevMonthBtn = document.querySelector("#prevMonthBtn");
const nextMonthBtn = document.querySelector("#nextMonthBtn");
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

function moveMonth(direction) {
  const nextOffset = displayedMonthOffset + direction;

  if (nextOffset < 0 || nextOffset > maxMonthOffset) {
    return;
  }

  displayedMonthOffset = nextOffset;
  renderCalendar();
}

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

nameStartBtn.addEventListener("click", startWithName);
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startWithName();
  }
});

renderCalendar();
renderSummary();
renderSelectionList();
