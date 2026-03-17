/* ================================================================
   ZIO  –  Smart Work Tracker  |  app.js  v5
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Features: Landing, Auth, Dashboard, Timer, Calendar, PDF
   ================================================================ */

// ── Globals ──
let currentUser = null;
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let authMode = 'login'; 
let viewDate = new Date(); 
let currentLang = 'en';

const translations = {
  en: {
    nav_dashboard: "Dashboard", nav_timer: "Work Hours", nav_reports: "Monthly Report", nav_settings: "Settings",
    th_day: "Day", th_date: "Date", th_details: "Work Details", th_hours: "Total Hours", th_action: "Action",
    total_label: "Total Hours This Month:", btn_download: "Download PDF",
    quick_title: "Quick Entry", btn_add: "+ Add Session",
    btn_add_row: "+ Add New Row",
    no_sessions: "No sessions logged for this month.", toast_saved: "Session logged!",
    pdf_report_title: "Work Report", pdf_company: "Company", pdf_period: "Period", pdf_name: "Name",
    db_status: "Strictly On-Device Storage (Private)"
  },
  it: {
    nav_dashboard: "Dashboard", nav_timer: "Ore di Lavoro", nav_reports: "Rapporto Mensile", nav_settings: "Impostazioni",
    th_day: "Giorno", th_date: "Data", th_details: "Dettagli Lavoro", th_hours: "Ore Totali", th_action: "Azione",
    total_label: "Ore Totali Questo Mese:", btn_download: "Scarica PDF",
    quick_title: "Inserimento Rapido", btn_add: "+ Aggiungi Sessione",
    btn_add_row: "+ Aggiungi Riga",
    no_sessions: "Nessuna sessione registrata per questo mese.", toast_saved: "Sessione salvata!",
    pdf_report_title: "Rapporto di Lavoro", pdf_company: "Azienda", pdf_period: "Periodo", pdf_name: "Nome",
    db_status: "Memoria Interna Dispositivo (AUTO)"
  },
  si: {
    nav_dashboard: "දර්ශක පුවරුව", nav_timer: "වැඩ කරන පැය", nav_reports: "මාසික වාර්තාව", nav_settings: "සැකසුම්",
    th_day: "දිනය (දවස)", th_date: "දිනය", th_details: "වැඩ විස්තර", th_hours: "මුළු පැය ගණන", th_action: "ක්‍රියාව",
    total_label: "මෙම මාසයේ මුළු පැය ගණන:", btn_download: "PDF බාගත කරන්න",
    quick_title: "ඉක්මන් ඇතුළත් කිරීම", btn_add: "+ ඇතුළත් කරන්න",
    btn_add_row: "+ පේළියක් එක් කරන්න",
    no_sessions: "මෙම මාසය සඳහා සටහන් කිසිවක් නැත.", toast_saved: "සටහන් කරන ලදී!",
    pdf_report_title: "වැඩ වාර්තාව", pdf_company: "ආයතනය", pdf_period: "කාල සීමාව", pdf_name: "නම",
    db_status: "ඔබේම උපකරණය මත පමණක් දත්ත ගබඩා වේ (පුද්ගලිකයි)"
  },
  ta: {
    nav_dashboard: "டாஷ்போர்டு", nav_timer: "வேலை நேரம்", nav_reports: "மாதாந்திர அறிக்கை", nav_settings: "அமைப்புகள்",
    th_day: "நாள்", th_date: "தேதி", th_details: "வேலை விவரங்கள்", th_hours: "மொத்த நேரம்", th_action: "செயல்",
    total_label: "இந்த மாத மொத்த நேரம்:", btn_download: "PDF பதிவிறக்கம்",
    quick_title: "விரைவான உள்ளீடு", btn_add: "+ சேர்க்க",
    btn_add_row: "+ வரிசையைச் சேர்க்கவும்",
    no_sessions: "இந்த மாதத்தில் அமர்வுகள் எதுவும் இல்லை.", toast_saved: "சேமிக்கப்பட்டது!",
    pdf_report_title: "வேலை அறிக்கை", pdf_company: "நிறுவனம்", pdf_period: "காலம்", pdf_name: "பெயர்",
    db_status: "உள் [சாதன] சேமிப்பு (AUTO)"
  }
};

// ── State Management Helpers ──
const getLS = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const getUsers = () => getLS('zio_users');
const getSessions = (user) => getLS(`zio_sessions_${user}`);

/* ================================================================
   1. NAVIGATION & UI SWITCHES
   ================================================================ */

function showAuthPage(mode = 'login') {
  authMode = mode;
  document.getElementById('auth-overlay').style.display = 'flex';
  updateAuthUI();
}

function hideAuthPage() {
  document.getElementById('auth-overlay').style.display = 'none';
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthUI();
}

function updateAuthUI() {
  const title = document.getElementById('auth-title');
  const nameField = document.getElementById('name-field');
  const switchText = document.getElementById('auth-switch-text');
  const switchLink = document.getElementById('auth-switch-link');

  if (authMode === 'login') {
    title.textContent = 'Welcome Back';
    nameField.style.display = 'none';
    switchText.textContent = "Don't have an account?";
    switchLink.textContent = 'Sign Up';
  } else {
    title.textContent = 'Create Account';
    nameField.style.display = 'block';
    switchText.textContent = 'Already have an account?';
    switchLink.textContent = 'Login';
  }
}

function navigate(pageId) {
  // Update Active Link UI
  const navItems = document.querySelectorAll('.nav-link-item, .mobile-nav-item');
  navItems.forEach(item => {
    if (item.id === `nav-${pageId}` || item.id === `m-nav-${pageId}`) item.classList.add('active');
    else item.classList.remove('active');
  });

  // Switch Pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`pg-${pageId}`).classList.add('active');

  // Trigger Renders
  if (pageId === 'dashboard') renderWorksheet();
  if (pageId === 'history') renderHistory();
  if (pageId === 'calendar') renderCalendar();
  if (pageId === 'reports') buildReport();
  if (pageId === 'settings') loadSettings();
}

/* ── Theme Toggle Logic ── */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('zio_theme', newTheme);
  
  updateThemeUI(newTheme);
  showToast(`Switched to ${newTheme} mode!`);
}

function updateThemeUI(theme) {
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');
  
  if (theme === 'dark') {
    if (lightIcon) lightIcon.style.display = 'none';
    if (darkIcon) darkIcon.style.display = 'block';
  } else {
    if (lightIcon) lightIcon.style.display = 'block';
    if (darkIcon) darkIcon.style.display = 'none';
  }
}

/* ================================================================
   2. AUTHENTICATION
   ================================================================ */

function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const users = getUsers();

  if (authMode === 'login') {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) login(user);
    else showToast('Invalid credentials!', 'error');
  } else {
    const name = document.getElementById('auth-name').value.trim();
    if (users.find(u => u.username === username)) {
      showToast('Username already exists!', 'error');
      return;
    }
    const newUser = { name, username, password };
    users.push(newUser);
    setLS('zio_users', users);
    login(newUser);
  }
}

function login(user) {
  currentUser = user;
  localStorage.setItem('zio_active_user', JSON.stringify(user));
  hideAuthPage();
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  
  applyTranslations();
  
  // Set Profile UI
  if (document.getElementById('user-initials')) document.getElementById('user-initials').textContent = user.name[0].toUpperCase();
  if (document.getElementById('user-display-name')) document.getElementById('user-display-name').textContent = user.name;
  document.getElementById('user-initials-top').textContent = user.name[0].toUpperCase();
  
  showToast(`Welcome back, ${user.name}!`);
  navigate('dashboard');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('zio_active_user');
  document.getElementById('landing-page').style.display = 'block';
  document.getElementById('main-app').style.display = 'none';
  showToast('Logged out successfully.');
}

/* ================================================================
   3. TIMER LOGIC
   ================================================================ */

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  document.getElementById('btn-timer-start').style.display = 'none';
  document.getElementById('btn-timer-pause').style.display = 'inline-block';
  document.getElementById('btn-timer-stop').style.display = 'inline-block';

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
  showToast('Timer started.');
}

function pauseTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-start').textContent = 'Resume Session';
  document.getElementById('btn-timer-pause').style.display = 'none';
}

function stopTimer() {
  clearInterval(timerInterval);
  const project = document.getElementById('timer-project').value || 'Unnamed Project';
  const notes = document.getElementById('timer-notes').value || '';
  const now = new Date();
  
  // Calculate Start Time
  const startTime = new Date(now.getTime() - timerSeconds * 1000);
  
  const session = {
    id: Date.now(),
    date: now.toISOString().split('T')[0],
    project,
    notes,
    start: startTime.toTimeString().split(' ')[0].substring(0, 5),
    end: now.toTimeString().split(' ')[0].substring(0, 5),
    duration: (timerSeconds / 3600).toFixed(2), // in hours
  };

  saveSession(session);
  resetTimer();
  showToast('Session saved!');
  navigate('dashboard');
}

function resetTimer() {
  isTimerRunning = false;
  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-start').textContent = 'Start Session';
  document.getElementById('btn-timer-pause').style.display = 'none';
  document.getElementById('btn-timer-stop').style.display = 'none';
  document.getElementById('timer-project').value = '';
  document.getElementById('timer-notes').value = '';
}

function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  document.getElementById('timer-display').textContent = 
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ================================================================
   4. DATA HANDLING (History & Dashboard)
   =============================================================== */

function saveSession(session) {
  const sessions = getSessions(currentUser.username);
  sessions.push(session);
  setLS(`zio_sessions_${currentUser.username}`, sessions);
}

function handleManualSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('m-date').value;
  const project = document.getElementById('m-project').value;
  const start = document.getElementById('m-start').value;
  const end = document.getElementById('m-end').value;
  const notes = document.getElementById('m-notes').value;

  // Calculate Duration
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let dur = (h2 + m2/60) - (h1 + m1/60);
  if (dur < 0) dur += 24; // Handle midnight wrap

  const session = {
    id: Date.now(),
    date,
    project,
    start,
    end,
    notes,
    duration: dur.toFixed(2)
  };

  saveSession(session);
  showToast('Entry saved!');
  e.target.reset();
  navigate('history');
}

/* ================================================================
   4. DATA HANDLING (History & Monthly Worksheet)
   =============================================================== */

function changeMonth(delta) {
  viewDate.setMonth(viewDate.getMonth() + delta);
  renderWorksheet();
}

function selectMonth(m, y) {
  viewDate = new Date(y, m, 1);
  toggleMonthDropdown(false);
  renderWorksheet();
}

function jumpToToday() {
  viewDate = new Date();
  renderWorksheet();
  showToast('Jumped to current month.');
}

function toggleMonthDropdown(force) {
  const dropdown = document.getElementById('month-dropdown');
  const isActive = typeof force === 'boolean' ? !force : dropdown.classList.contains('active');
  
  if (!isActive) {
    populateMonthDropdown();
    dropdown.classList.add('active');
  } else {
    dropdown.classList.remove('active');
  }
}

function populateMonthDropdown() {
  const dropdown = document.getElementById('month-dropdown');
  const year = viewDate.getFullYear();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Show last 6 months
  let html = '';
  for (let i = -2; i <= 3; i++) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + i, 1);
    const mName = months[d.getMonth()];
    const yVal = d.getFullYear();
    html += `<div class="month-dropdown-item" onclick="selectMonth(${d.getMonth()}, ${yVal})">${mName} ${yVal}</div>`;
  }
  dropdown.innerHTML = html;
}

function changeLanguage(lang) {
  currentLang = lang;
  applyTranslations();
  renderWorksheet();
}

function applyTranslations() {
  const t = translations[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  
  // Also update placeholders if any
  if (document.getElementById('d-project')) {
    document.getElementById('d-project').placeholder = currentLang === 'en' ? 'e.g. ASSOGESTIONI' : '';
  }
}

function renderWorksheet() {
  const sessions = getSessions(currentUser.username);
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString(currentLang, { month: 'long' });
  const t = translations[currentLang];

  document.getElementById('display-month-name').textContent = `${monthName} ${year}`;
  
  // Filter sessions for this month
  const filtered = sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  const body = document.getElementById('worksheet-body');
  let html = '';
  let monthlyTotal = 0;

  const grouped = {};
  filtered.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  Object.keys(grouped).sort().forEach(date => {
    const daySessions = grouped[date];
    const dObj = new Date(date);
    const dayName = dObj.toLocaleDateString(currentLang, { weekday: 'long' });
    let dayTotal = 0;
    
    // Check if it is today
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = date === todayStr;
    const rowClass = isToday ? 'class="today-row"' : '';

    daySessions.forEach(s => {
      const dur = parseFloat(s.duration) || 0;
      dayTotal += dur;
      monthlyTotal += dur;
      html += `
        <tr ${rowClass} data-id="${s.id}">
          <td>${dayName}</td>
          <td class="td-date-picker">
            <input type="date" value="${date}" onchange="updateSessionDetails(${s.id}, 'date', this.value)" class="table-date-input">
          </td>
          <td contenteditable="true" class="editable-project" data-placeholder="Task / Project name..." onblur="updateSessionDetails(${s.id}, 'project', this.textContent)">${s.project}</td>
          <td contenteditable="true" class="editable-duration" data-placeholder="0.00" onblur="updateSessionDetails(${s.id}, 'duration', this.textContent)">${s.duration || ''}</td>
          <td style="text-align: right;"><button class="nav-arrow" style="font-size: 1rem;" onclick="deleteSession(${s.id})">🗑️</button></td>
        </tr>
      `;
    });

  });

  if (filtered.length === 0) {
    html = `<tr><td colspan="5" style="text-align: center; padding: 3rem;">${t.no_sessions}</td></tr>`;
  }

  body.innerHTML = html;
  body.innerHTML += `
    <tr>
      <td colspan="5" style="padding: 1rem 0;">
        <button onclick="addNewRow()" class="btn-secondary" style="width: 100%; border-style: dashed;">${t.btn_add_row}</button>
      </td>
    </tr>
  `;
  document.getElementById('monthly-total-value').textContent = monthlyTotal.toFixed(2);
}

function updateSessionDetails(id, field, newValue) {
  const sessions = getSessions(currentUser.username);
  const session = sessions.find(s => s.id === id);
  if (session) {
    if (field === 'duration') {
      session.duration = parseFloat(newValue) || 0;
    } else {
      session[field] = newValue;
    }
    setLS(`zio_sessions_${currentUser.username}`, sessions);
    renderWorksheet();
  }
}

function addNewRow() {
  const dateStr = viewDate.toISOString().split('T')[0];
  const newId = Date.now();
  const session = {
    id: newId,
    date: dateStr,
    project: "",
    start: "09:00",
    end: "10:00",
    duration: "",
    notes: ""
  };
  saveSession(session);
  renderWorksheet();

  // Focus the newly added row's project cell
  setTimeout(() => {
    const row = document.querySelector(`[data-id="${newId}"]`);
    if (row) {
      const projectCell = row.querySelector('.editable-project');
      if (projectCell) {
        projectCell.focus();
        // Select all text for easy replacement
        const range = document.createRange();
        range.selectNodeContents(projectCell);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, 100);
  
  showToast('New row added. Start typing!');
}

function renderHistory() {
  const sessions = getSessions(currentUser.username);
  const body = document.getElementById('history-table-body');
  body.innerHTML = [...sessions].reverse().map(s => `
    <tr>
      <td>${s.date}</td>
      <td><strong>${s.project}</strong></td>
      <td>${s.start}</td>
      <td>${s.end}</td>
      <td><span class="badge" style="background: var(--primary-yellow);">${s.duration}h</span></td>
      <td style="color: var(--text-grey); font-size: 0.75rem;">${s.notes || '--'}</td>
      <td><button class="btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteSession(${s.id})">Delete</button></td>
    </tr>
  `).join('');
}

function deleteSession(id) {
  if (!confirm('Are you sure?')) return;
  const sessions = getSessions(currentUser.username).filter(s => s.id !== id);
  setLS(`zio_sessions_${currentUser.username}`, sessions);
  showToast('Session deleted.');
  renderWorksheet();
  renderHistory();
}

/* ================================================================
   5. CALENDAR & REPORTS
   =============================================================== */

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const sessions = getSessions(currentUser.username);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  grid.innerHTML = dayNames.map(d => `<div class="calendar-day-head">${d}</div>`).join('');
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Padding
  for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div class="calendar-day" style="background: #fdfdfd; opacity: 0.3;"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasLog = sessions.some(s => s.date === dateStr);
    
    grid.innerHTML += `
      <div class="calendar-day">
        <div class="calendar-day-num">${d}</div>
        ${hasLog ? '<div class="calendar-dot"></div>' : ''}
      </div>
    `;
  }
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const sessions = getSessions(currentUser.username);
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString(currentLang, { month: 'long' });
  const t = translations[currentLang];

  // Filter for viewed month
  const filtered = sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // 1. Branding Header
  // Logo Background (Yellow Rounded Square)
  doc.setFillColor(255, 216, 77); // #FFD84D
  doc.roundedRect(14, 15, 12, 12, 2, 2, 'F');
  
  // Draw Vector Lightning Bolt (instead of emoji)
  doc.setFillColor(26, 26, 26); // Dark color for the bolt
  // Top triangle of the bolt
  doc.triangle(22, 17, 17, 22, 20.5, 22, 'F');
  // Bottom triangle of the bolt
  doc.triangle(19.5, 20, 23, 20, 18, 25, 'F');
  
  // Brand Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Zio', 30, 24);
  
  // Header Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Work Hours Tracking System', 30, 28);

  // Horizontal Line
  doc.setDrawColor(243, 244, 246);
  doc.line(14, 35, 196, 35);

  // 2. Report Info
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.pdf_report_title, 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.pdf_period}: ${monthName} ${year}`, 14, 55);
  doc.text(`${t.pdf_name}: ${currentUser.name}`, 14, 60);

  let offsetY = 60;
  if (currentUser.company && currentUser.showCompany) {
    offsetY += 5;
    doc.text(`${t.pdf_company}: ${currentUser.company}`, 14, offsetY);
  }

  const tableData = filtered.map(s => {
    const dObj = new Date(s.date);
    const dayName = dObj.toLocaleDateString(currentLang, { weekday: 'short' });
    return [dayName, s.date, s.project, (s.duration || '0') + 'h'];
  });
  
  doc.autoTable({
    startY: offsetY + 10,
    head: [[t.th_day, t.th_date, t.th_details, t.th_hours]],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 216, 77], 
      textColor: [26, 26, 26],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4, 
      overflow: 'linebreak',
      font: 'helvetica' 
    },
    columnStyles: {
      0: { cellWidth: 35 }, 
      1: { cellWidth: 30 }, 
      2: { cellWidth: 'auto' }, 
      3: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: function (data) {
      // Footer URL
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.line(14, doc.internal.pageSize.height - 20, 196, doc.internal.pageSize.height - 20);
      doc.text(`www.zio.com`, 196, doc.internal.pageSize.height - 12, { align: 'right' });
    }
  });

  const total = filtered.reduce((acc, s) => acc + (parseFloat(s.duration) || 0), 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text(`${t.total_label} ${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 12);

  doc.save(`Zio_Report_${monthName}_${year}.pdf`);
  showToast('PDF Exported!');
}

/* ================================================================
   UTILS
   =============================================================== */

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.background = type === 'error' ? '#EF4444' : '#1F2933';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function viewDemo() { 
  const demoUser = { name: 'Demo User', username: 'demo', password: '123' };
  
  // Add some sample data for demo
  const sampleSessions = [
    { id: 1, date: '2026-03-02', project: 'ASSOGESTIONI', duration: '2.00', start: '09:00', end: '11:00' },
    { id: 2, date: '2026-03-02', project: 'CBM', duration: '2.75', start: '11:15', end: '14:00' },
    { id: 3, date: '2026-03-03', project: 'CIRDAN CAPITAL', duration: '2.75', start: '10:00', end: '12:45' },
    { id: 4, date: '2026-03-10', project: 'DESIGN REVIEW', duration: '4.50', start: '14:00', end: '18:30' }
  ];
  if (getSessions('demo').length === 0) {
    setLS('zio_sessions_demo', sampleSessions);
  }
  
  login(demoUser);
}

function saveSettings() {
  const name = document.getElementById('s-name').value;
  const company = document.getElementById('s-company').value;
  const showCompany = document.getElementById('s-show-company').checked;

  if (name) {
    currentUser.name = name;
    currentUser.company = company;
    currentUser.showCompany = showCompany;
    
    localStorage.setItem('zio_active_user', JSON.stringify(currentUser));
    
    // Update users catalog too
    const users = getUsers();
    const idx = users.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) {
      users[idx] = currentUser;
      setLS('zio_users', users);
    }

    if (document.getElementById('user-initials-top')) {
      document.getElementById('user-initials-top').textContent = name[0].toUpperCase();
    }
    
    showToast('Settings saved!');
  }
}


function loadSettings() {
  document.getElementById('s-name').value = currentUser.name || '';
  document.getElementById('s-company').value = currentUser.company || '';
  document.getElementById('s-show-company').checked = !!currentUser.showCompany;
}

/* ================================================================
   DATA PERSISTENCE (Export/Import)
   =============================================================== */

function exportData() {
  const allData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('zio_')) {
      allData[key] = localStorage.getItem(key);
    }
  }

  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Zio_Data_Backup_${dateStr}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Data Exported to Device!');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data['zio_users']) {
        throw new Error('Invalid Zio data file.');
      }

      Object.keys(data).forEach(key => {
        if (key.startsWith('zio_')) {
          localStorage.setItem(key, data[key]);
        }
      });

      showToast('Data Restored Successfully!', 'success');
      alert('Application data restored. The app will reload now.');
      window.location.reload(); 
    } catch (err) {
      showToast('Error: Invalid file format.', 'error');
    }
  };
  reader.readAsText(file);
}

// ── Boot ──
window.onload = () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log("SW registration failed", err));
  }

  // Request Storage Persistence
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
      if (granted) console.log("Storage will not be cleared except by explicit user action");
    });
  }

  const active = localStorage.getItem('zio_active_user');
  if (active) login(JSON.parse(active));

  // Initialize Theme
  const savedTheme = localStorage.getItem('zio_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (document.getElementById('d-date')) document.getElementById('d-date').value = today;
  if (document.getElementById('m-date')) document.getElementById('m-date').value = today;

  // Scroll Reveal Observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Close dropdown on outside click
  window.onclick = (e) => {
    if (!e.target.closest('.current-month-display')) {
      const dropdown = document.getElementById('month-dropdown');
      if (dropdown) dropdown.classList.remove('active');
    }
  };
};
