console.log("🔥 JS 시작");

const calendar = document.getElementById("calendar");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("saveBtn");

console.log("calendar:", calendar);
console.log("saveBtn:", saveBtn);

// 달력 생성
for (let i = 1; i <= 31; i++) {
  const day = document.createElement("div");
  day.className = "day";
  day.innerText = i;

  day.onclick = () => {
    modal.style.display = "flex";
  };

  calendar.appendChild(day);
}

// 저장 버튼
saveBtn.onclick = () => {
  console.log("🔥 저장 클릭됨");
  modal.style.display = "none";
};