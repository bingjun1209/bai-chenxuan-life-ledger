"use strict";

const STORAGE_KEY = "bai-chenxuan-expenses-v1";

const expenseForm = document.querySelector("#expenseForm");
const itemInput = document.querySelector("#itemInput");
const amountInput = document.querySelector("#amountInput");
const categoryInput = document.querySelector("#categoryInput");
const dateInput = document.querySelector("#dateInput");
const noteInput = document.querySelector("#noteInput");
const formMessage = document.querySelector("#formMessage");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const monthFilter = document.querySelector("#monthFilter");
const recordsList = document.querySelector("#recordsList");
const emptyState = document.querySelector("#emptyState");
const recordTemplate = document.querySelector("#recordTemplate");
const monthTotal = document.querySelector("#monthTotal");
const todayTotal = document.querySelector("#todayTotal");
const recordCount = document.querySelector("#recordCount");
const monthLabel = document.querySelector("#monthLabel");
const todayLabel = document.querySelector("#todayLabel");
const resultText = document.querySelector("#resultText");
const categoryBars = document.querySelector("#categoryBars");
const distributionLabel = document.querySelector("#distributionLabel");
const clearButton = document.querySelector("#clearButton");
const exportButton = document.querySelector("#exportButton");
const menuButton = document.querySelector("#menuButton");
const siteNav = document.querySelector("#siteNav");

const categoryStyles = {
  飲食: { color: "#a66342", bg: "#f6e7dc" },
  交通: { color: "#3c6e71", bg: "#e1eeee" },
  娛樂: { color: "#7062a3", bg: "#ebe7f7" },
  購物: { color: "#9a5c78", bg: "#f5e4ec" },
  生活: { color: "#55734b", bg: "#e7efe3" },
  其他: { color: "#62696b", bg: "#e9eced" }
};

let expenses = loadExpenses();

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthString() {
  return getLocalDateString().slice(0, 7);
}

function loadExpenses() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("無法讀取已保存的記帳資料：", error);
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return `NT$ ${Number(value).toLocaleString("zh-TW")}`;
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return "全部月份";
  const [year, month] = monthValue.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

function parseDateParts(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return { year, month, day };
}

function showFormMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.classList.toggle("success", type === "success");
}

function addExpense(event) {
  event.preventDefault();

  const item = itemInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const note = noteInput.value.trim();

  if (!item) {
    showFormMessage("請輸入消費項目。");
    itemInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showFormMessage("金額必須大於 0。");
    amountInput.focus();
    return;
  }

  if (!date) {
    showFormMessage("請選擇日期。");
    dateInput.focus();
    return;
  }

  expenses.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    item,
    amount: Math.round(amount),
    category,
    date,
    note,
    createdAt: Date.now()
  });

  saveExpenses();
  expenseForm.reset();
  dateInput.value = getLocalDateString();
  categoryInput.value = "飲食";
  showFormMessage("已加入一筆消費紀錄。", "success");
  render();
  itemInput.focus();
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

function clearAllExpenses() {
  if (expenses.length === 0) return;
  const confirmed = window.confirm("確定要清除全部消費紀錄嗎？這個動作無法復原。");
  if (!confirmed) return;

  expenses = [];
  saveExpenses();
  render();
  showFormMessage("全部紀錄已清除。", "success");
}

function getFilteredExpenses() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const month = monthFilter.value;

  return expenses
    .filter((expense) => {
      const matchesKeyword = !keyword ||
        expense.item.toLowerCase().includes(keyword) ||
        expense.note.toLowerCase().includes(keyword);
      const matchesCategory = category === "全部" || expense.category === category;
      const matchesMonth = !month || expense.date.startsWith(month);
      return matchesKeyword && matchesCategory && matchesMonth;
    })
    .sort((a, b) => {
      if (a.date === b.date) return b.createdAt - a.createdAt;
      return b.date.localeCompare(a.date);
    });
}

function renderSummary() {
  const today = getLocalDateString();
  const currentMonth = getCurrentMonthString();
  const monthExpenses = expenses.filter((expense) => expense.date.startsWith(currentMonth));
  const todayExpenses = expenses.filter((expense) => expense.date === today);

  const monthSum = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todaySum = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  monthTotal.textContent = formatCurrency(monthSum);
  todayTotal.textContent = formatCurrency(todaySum);
  recordCount.textContent = `${expenses.length} 筆`;
  monthLabel.textContent = `${formatMonthLabel(currentMonth)}累計`;
  todayLabel.textContent = todayExpenses.length ? `今天共 ${todayExpenses.length} 筆` : "今天尚未記帳";
}

function renderRecords(filteredExpenses) {
  recordsList.replaceChildren();
  emptyState.hidden = filteredExpenses.length !== 0;

  filteredExpenses.forEach((expense) => {
    const fragment = recordTemplate.content.cloneNode(true);
    const recordItem = fragment.querySelector(".record-item");
    const { month, day } = parseDateParts(expense.date);
    const style = categoryStyles[expense.category] || categoryStyles.其他;

    fragment.querySelector(".date-day").textContent = String(day).padStart(2, "0");
    fragment.querySelector(".date-month").textContent = `${month} 月`;
    fragment.querySelector(".record-title").textContent = expense.item;

    const categoryTag = fragment.querySelector(".category-tag");
    categoryTag.textContent = expense.category;
    categoryTag.style.setProperty("--tag-color", style.color);
    categoryTag.style.setProperty("--tag-bg", style.bg);

    const noteElement = fragment.querySelector(".record-note");
    noteElement.textContent = expense.note || "沒有備註";
    fragment.querySelector(".record-amount").textContent = formatCurrency(expense.amount);
    fragment.querySelector(".delete-button").addEventListener("click", () => deleteExpense(expense.id));

    recordItem.dataset.id = expense.id;
    recordsList.appendChild(fragment);
  });

  resultText.textContent = filteredExpenses.length === expenses.length
    ? `顯示全部 ${expenses.length} 筆紀錄`
    : `找到 ${filteredExpenses.length} 筆符合的紀錄`;
}

function renderCategoryBars(filteredExpenses) {
  categoryBars.replaceChildren();
  const totals = Object.keys(categoryStyles).reduce((result, category) => {
    result[category] = 0;
    return result;
  }, {});

  filteredExpenses.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  });

  const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const sortedCategories = Object.entries(totals)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length === 0) {
    const text = document.createElement("p");
    text.className = "empty-distribution";
    text.textContent = "有消費紀錄後，這裡會顯示各類別的比例。";
    text.style.color = "#7d8181";
    text.style.fontSize = "0.84rem";
    categoryBars.appendChild(text);
    return;
  }

  sortedCategories.forEach(([category, total]) => {
    const percentage = grandTotal ? (total / grandTotal) * 100 : 0;
    const style = categoryStyles[category] || categoryStyles.其他;
    const row = document.createElement("div");
    row.className = "category-bar-row";
    row.innerHTML = `
      <strong>${category}</strong>
      <div class="category-bar-track" aria-label="${category} ${percentage.toFixed(1)}%">
        <div class="category-bar-fill" style="--bar-width:${percentage}%; --bar-color:${style.color}"></div>
      </div>
      <span class="category-bar-value">${formatCurrency(total)}</span>
    `;
    categoryBars.appendChild(row);
  });
}

function render() {
  const filteredExpenses = getFilteredExpenses();
  renderSummary();
  renderRecords(filteredExpenses);
  renderCategoryBars(filteredExpenses);

  const selectedMonth = monthFilter.value;
  distributionLabel.textContent = selectedMonth
    ? `${formatMonthLabel(selectedMonth)}的篩選結果`
    : "目前篩選結果";
}

function exportCsv() {
  if (expenses.length === 0) {
    window.alert("目前沒有可以匯出的紀錄。");
    return;
  }

  const header = ["日期", "消費項目", "類別", "金額", "備註"];
  const rows = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((expense) => [expense.date, expense.item, expense.category, expense.amount, expense.note]);

  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csvContent = [header, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `白宸瑄-生活記帳-${getLocalDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toggleMenu() {
  const isOpen = siteNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
}

function closeMenu() {
  siteNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}

dateInput.value = getLocalDateString();
monthFilter.value = "";

expenseForm.addEventListener("submit", addExpense);
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
monthFilter.addEventListener("change", render);
clearButton.addEventListener("click", clearAllExpenses);
exportButton.addEventListener("click", exportCsv);
menuButton.addEventListener("click", toggleMenu);
siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

render();
