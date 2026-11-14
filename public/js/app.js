// Phoenix Tech Solutions - Enterprise Portal Application JS
const API_BASE = '/api';

// Designation Options
const DESIGNATIONS = [
  'Software Development Intern',
  'Hardware Development Intern',
  'Full Stack Development Intern',
  'Frontend Development Intern',
  'Backend Development Intern',
  'Mobile Application Development Intern',
  'Web Development Intern',
  'AI & ML Intern',
  'Data Science Intern',
  'Cyber Security Intern',
  'IoT Development Intern',
  'Embedded Systems Intern',
  'Robotics Intern',
  'Electronics & Hardware Intern',
  'VLSI Design Intern',
  'Network Engineering Intern',
  'Cloud Computing Intern',
  'DevOps Intern',
  'UI/UX Design Intern',
  'Digital Marketing Intern',
  'Other / Custom Designation'
];

// Areas of Interest Catalog
const INTEREST_CATEGORIES = {
  'Software & Development': [
    'Web Development', 'Frontend Development', 'Backend Development', 'Full Stack Development',
    'Mobile App Development', 'Android Development', 'iOS Development', 'Software Engineering',
    'Game Development', 'API Development'
  ],
  'Artificial Intelligence & Data': [
    'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Generative AI',
    'Natural Language Processing', 'Computer Vision', 'Data Science', 'Data Analytics',
    'Big Data', 'Business Intelligence'
  ],
  'Hardware & Electronics': [
    'Hardware Development', 'Embedded Systems', 'Internet of Things (IoT)', 'Industrial IoT',
    'Robotics', 'Arduino Development', 'ESP32 Development', 'Microcontrollers',
    'PCB Design', 'VLSI Design', 'FPGA Development', 'Digital Electronics', 'Sensor Technology', 'Automation Systems'
  ],
  'Security & Networking': [
    'Cyber Security', 'Ethical Hacking', 'Network Security', 'Information Security',
    'Digital Forensics', 'Cloud Security', 'Penetration Testing', 'Network Administration'
  ],
  'Cloud & Infrastructure': [
    'Cloud Computing', 'AWS', 'Microsoft Azure', 'Google Cloud', 'DevOps', 'Docker', 'Kubernetes', 'System Administration'
  ],
  'Design & Creative': [
    'UI/UX Design', 'Graphic Design', '3D Modeling', '3D Animation', 'Video Editing', 'AR/VR Development', 'Game Design'
  ],
  'Business & Other': [
    'Digital Marketing', 'Product Management', 'Project Management', 'Business Analytics', 'Research & Development', 'Technical Writing'
  ]
};

// Technical Skills Catalog
const SKILL_CATEGORIES = {
  'Programming Languages': ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'PHP', 'Go', 'Rust', 'Kotlin', 'Swift', 'Dart', 'R', 'MATLAB'],
  'Frontend Technologies': ['HTML', 'CSS', 'React.js', 'Angular', 'Vue.js', 'Next.js', 'Bootstrap', 'Tailwind CSS'],
  'Backend Technologies': ['Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Laravel', 'REST API', 'GraphQL'],
  'Database Technologies': ['MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'SQLite', 'Redis', 'Oracle Database'],
  'Hardware & Embedded': ['Arduino', 'ESP32', 'ESP8266', 'NodeMCU', 'Raspberry Pi', '8051 Microcontroller', 'ARM Microcontrollers', 'Embedded C', 'Verilog HDL', 'VHDL', 'PCB Design', 'Proteus', 'KiCad', 'Altium Designer', 'UART', 'SPI', 'I2C', 'MQTT', 'Sensor Integration'],
  'AI & Machine Learning': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenCV', 'Pandas', 'NumPy', 'Generative AI', 'LangChain'],
  'Cyber Security': ['Kali Linux', 'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'OWASP', 'Linux Security'],
  'Cloud & DevOps': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'Jenkins', 'CI/CD'],
  'Design & Other Tools': ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Blender', 'AutoCAD', 'Unity', 'Unreal Engine']
};

// Application State
const appState = {
  token: localStorage.getItem('pts_token') || null,
  user: JSON.parse(localStorage.getItem('pts_user') || 'null'),
  currentRole: 'admin', // login view selection: admin | staff | intern
  activeTab: 'dashboard',
  socket: null,
  notifications: [],
  unreadNotifsCount: 0,
  internsList: [],
  projectsList: [],
  assignmentsList: [],
  reportsList: [],
  selectedInternsForAssignment: new Set(),
  // Multi-select temporary states
  selectedSkills: new Set(),
  selectedInterests: new Set()
};

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600/90 border-emerald-500' :
             type === 'error' ? 'bg-rose-600/90 border-rose-500' : 'bg-indigo-600/90 border-indigo-500';

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-white text-sm backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 ${bg}`;
  toast.innerHTML = `
    <span class="text-lg">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Socket.IO Setup
function initSocket() {
  if (typeof io === 'undefined') return;
  try {
    appState.socket = io(window.location.origin);
    appState.socket.on('connect', () => {
      console.log('[Socket] Connected to real-time events');
      if (appState.user) {
        appState.socket.emit('join_portal', {
          role: appState.user.role,
          userId: appState.user.adminId || appState.user.internId
        });
      }
    });

    appState.socket.on('notification', (notif) => {
      showToast(notif.notificationTitle + ': ' + notif.notificationMessage, 'info');
      fetchNotifications();
      if (appState.user && appState.user.role === 'admin') {
        fetchAdminOverview();
      }
    });
  } catch (err) {
    console.error('Socket init error:', err);
  }
}

// API Fetch Helper
async function apiCall(endpoint, options = {}) {
  const headers = options.headers || {};
  if (appState.token) {
    headers['Authorization'] = `Bearer ${appState.token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Authentication Handlers
async function handleLogin(e) {
  e.preventDefault();
  const identifierInput = document.getElementById('loginIdentifier');
  const passwordInput = document.getElementById('loginPassword');
  const role = appState.currentRole;

  if (role === 'staff') {
    showToast('Staff portal is currently inactive (Coming Soon in Phase 2).', 'info');
    return;
  }

  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;

  if (!identifier || !password) {
    showToast('Please provide both User ID / Email and password.', 'error');
    return;
  }

  const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/intern/login';

  try {
    const data = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    appState.token = data.token;
    appState.user = data.user;
    localStorage.setItem('pts_token', data.token);
    localStorage.setItem('pts_user', JSON.stringify(data.user));

    showToast(`Welcome back, ${data.user.name || data.user.fullName}!`, 'success');

    if (appState.socket) {
      appState.socket.emit('join_portal', {
        role: data.user.role,
        userId: data.user.adminId || data.user.internId
      });
    }

    renderPortal();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function logout() {
  appState.token = null;
  appState.user = null;
  localStorage.removeItem('pts_token');
  localStorage.removeItem('pts_user');
  renderPortal();
  showToast('Logged out successfully.', 'info');
}

// Switch Role in Login
function selectLoginRole(role) {
  appState.currentRole = role;
  const adminBtn = document.getElementById('roleBtnAdmin');
  const staffBtn = document.getElementById('roleBtnStaff');
  const internBtn = document.getElementById('roleBtnIntern');
  const identifierLabel = document.getElementById('identifierLabel');
  const identifierInput = document.getElementById('loginIdentifier');
  const submitBtnText = document.getElementById('submitBtnText');

  [adminBtn, staffBtn, internBtn].forEach(b => {
    b.className = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-white hover:bg-slate-800/50';
  });

  if (role === 'admin') {
    adminBtn.className = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/25';
    identifierLabel.innerText = 'Admin User ID or Email';
    identifierInput.placeholder = 'mahendhra2005@gamil.com or PTS-CEO-001';
    submitBtnText.innerText = 'Login as Administrator →';
  } else if (role === 'staff') {
    staffBtn.className = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-amber-500/20 text-amber-400 border border-amber-500/40';
    identifierLabel.innerText = 'Staff User ID or Email';
    identifierInput.placeholder = 'staff@phoenixtech.com';
    submitBtnText.innerText = 'Staff Portal (Coming Soon)';
    showToast('The Staff Portal is scheduled for deployment in Phase 2.', 'info');
  } else {
    internBtn.className = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/25';
    identifierLabel.innerText = 'Intern User ID or Email';
    identifierInput.placeholder = 'PTS-INT-001 or registered email';
    submitBtnText.innerText = 'Login as Intern →';
  }
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
  }
}

// Tab navigation
function switchAdminTab(tab) {
  appState.activeTab = tab;
  document.querySelectorAll('.admin-nav-item').forEach(el => {
    if (el.dataset.tab === tab) {
      el.className = 'admin-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30';
    } else {
      el.className = 'admin-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-slate-100 hover:bg-slate-800/60';
    }
  });

  document.getElementById('breadcrumbCurrent').innerText =
    tab === 'dashboard' ? 'Dashboard Overview' :
    tab === 'activity' ? 'Activity & Logs' :
    tab === 'projects' ? 'Project Management' :
    tab === 'assign' ? 'Assign Projects' :
    tab === 'interns' ? 'Intern Management' :
    tab === 'reports' ? 'Reports Management' :
    tab === 'profile' ? 'Admin Profile' : 'System Settings';

  renderAdminTabContent(tab);
}

function switchInternTab(tab) {
  appState.activeTab = tab;
  document.querySelectorAll('.intern-nav-item').forEach(el => {
    if (el.dataset.tab === tab) {
      el.className = 'intern-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30';
    } else {
      el.className = 'intern-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-slate-100 hover:bg-slate-800/60';
    }
  });

  renderInternTabContent(tab);
}

// Fetch Admin Overview Statistics
async function fetchAdminOverview() {
  try {
    const res = await apiCall('/admin/overview');
    const d = res.data;

    document.getElementById('statTotalProjects').innerText = d.totalProjects;
    document.getElementById('statActiveProjects').innerText = d.activeProjects;
    document.getElementById('statCompletedProjects').innerText = d.completedProjects;
    document.getElementById('statTotalInterns').innerText = d.totalInterns;
    document.getElementById('statAvailableInterns').innerText = d.availableInterns;
    document.getElementById('statAssignedInterns').innerText = d.assignedInterns;
    document.getElementById('statPendingReports').innerText = d.pendingReports;
    document.getElementById('statSubmittedReports').innerText = d.submittedReports;

    // Load active projects preview
    const prjRes = await apiCall('/projects?status=Active');
    appState.projectsList = prjRes.projects || [];
    renderDashboardActiveProjects(appState.projectsList.slice(0, 5));

    // Load pending reports preview
    const repRes = await apiCall('/reports?status=Submitted');
    appState.reportsList = repRes.reports || [];
    renderDashboardPendingReports(appState.reportsList.slice(0, 5));
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

// Render Dashboard Preview Widgets
function renderDashboardActiveProjects(projects) {
  const container = document.getElementById('dashActiveProjectsContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-500">
        <p class="text-sm">No active projects currently in the repository.</p>
        <button onclick="openCreateProjectModal()" class="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ Create your first project</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
          <tr>
            <th class="px-4 py-3">Project</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Deadline</th>
            <th class="px-4 py-3">Assigned Team</th>
            <th class="px-4 py-3">Progress</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          ${projects.map(p => `
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-semibold text-slate-200">
                ${p.projectName}
                <div class="text-[10px] text-slate-400 font-mono">${p.projectId}</div>
              </td>
              <td class="px-4 py-3 text-slate-400">${p.category}</td>
              <td class="px-4 py-3 text-slate-300">${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}</td>
              <td class="px-4 py-3">
                <div class="flex items-center -space-x-1.5">
                  ${(p.teamMembers || []).slice(0, 3).map(m => `
                    <div class="w-6 h-6 rounded-full bg-indigo-600/80 border border-slate-900 flex items-center justify-center text-[10px] text-white font-bold" title="${m.fullName}">
                      ${m.fullName.charAt(0)}
                    </div>
                  `).join('')}
                  ${(p.teamMembers || []).length > 3 ? `<span class="text-[10px] text-slate-400 pl-2">+${p.teamMembers.length - 3}</span>` : ''}
                  ${(p.teamMembers || []).length === 0 ? `<span class="text-[11px] text-amber-500/80">Unassigned</span>` : ''}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${p.progress || 0}%"></div>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">${p.progress || 0}%</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button onclick="viewProjectDetails('${p.projectId}')" class="px-2.5 py-1 text-xs rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-medium transition inline-flex items-center gap-1">
                  About Project &rarr;
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDashboardPendingReports(reports) {
  const container = document.getElementById('dashPendingReportsContainer');
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center">
        <div class="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
          ✓
        </div>
        <p class="text-sm font-medium text-slate-300">All submitted reports have been reviewed!</p>
        <p class="text-xs text-slate-500 mt-1">New intern submissions will appear here automatically.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="divide-y divide-slate-800/60">
      ${reports.map(r => `
        <div class="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-200">${r.reportTitle}</span>
              <span class="badge-pending px-2 py-0.5 rounded text-[10px] font-mono">Week ${r.weekNumber}</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">
              By <strong class="text-slate-300">${r.internName}</strong> (${r.internId}) for <span class="text-indigo-300">${r.projectName}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openReviewReportModal('${r.reportId}')" class="px-2.5 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium">Review</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Notifications
async function fetchNotifications() {
  try {
    const res = await apiCall('/notifications');
    appState.notifications = res.notifications || [];
    appState.unreadNotifsCount = res.unreadCount || 0;

    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (appState.unreadNotifsCount > 0) {
        badge.innerText = appState.unreadNotifsCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    renderNotificationDropdown();
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
}

function renderNotificationDropdown() {
  const container = document.getElementById('notifListContainer');
  if (!container) return;

  if (appState.notifications.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">No notifications available.</div>`;
    return;
  }

  container.innerHTML = appState.notifications.map(n => `
    <div class="p-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition flex items-start gap-3 ${n.isRead ? 'opacity-65' : ''}">
      <div class="w-2 h-2 rounded-full mt-1.5 ${n.isRead ? 'bg-slate-600' : 'bg-indigo-500'}"></div>
      <div class="flex-1 text-xs">
        <div class="font-semibold text-slate-200">${n.notificationTitle}</div>
        <div class="text-slate-400 text-[11px] mt-0.5">${n.notificationMessage}</div>
        <div class="text-[9px] text-slate-500 mt-1">${new Date(n.createdAt).toLocaleTimeString()} · ${new Date(n.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  `).join('');
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('hidden');
}

async function markAllNotificationsRead() {
  try {
    await apiCall('/notifications/read-all', { method: 'PUT' });
    fetchNotifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Modal Controllers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

// Populate Multi-Select Dropdowns (Skills & Interests)
function initMultiSelectWidgets() {
  // Populate Designations
  const desigSelect = document.getElementById('internDesignation');
  if (desigSelect) {
    desigSelect.innerHTML = DESIGNATIONS.map(d => `<option value="${d}">${d}</option>`).join('');
  }

  // Populate Area of Interest Selector
  const interestCatContainer = document.getElementById('interestOptionsContainer');
  if (interestCatContainer) {
    interestCatContainer.innerHTML = Object.entries(INTEREST_CATEGORIES).map(([cat, list]) => `
      <div class="mb-3">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">${cat}</div>
        <div class="flex flex-wrap gap-1.5">
          ${list.map(item => `
            <button type="button" onclick="toggleMultiItem('interest', '${item}', this)" class="tag-pill px-2 py-1 rounded text-xs hover:border-indigo-500 transition cursor-pointer">
              + ${item}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Populate Technical Skills Selector
  const skillCatContainer = document.getElementById('skillOptionsContainer');
  if (skillCatContainer) {
    skillCatContainer.innerHTML = Object.entries(SKILL_CATEGORIES).map(([cat, list]) => `
      <div class="mb-3">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">${cat}</div>
        <div class="flex flex-wrap gap-1.5">
          ${list.map(item => `
            <button type="button" onclick="toggleMultiItem('skill', '${item}', this)" class="tag-pill px-2 py-1 rounded text-xs hover:border-indigo-500 transition cursor-pointer">
              + ${item}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

function toggleMultiItem(type, val, btn) {
  const set = type === 'skill' ? appState.selectedSkills : appState.selectedInterests;
  if (set.has(val)) {
    set.delete(val);
    btn.classList.remove('tag-selected');
    btn.innerText = `+ ${val}`;
  } else {
    set.add(val);
    btn.classList.add('tag-selected');
    btn.innerText = `✓ ${val}`;
  }
  updateSelectedPills(type);
}

function updateSelectedPills(type) {
  const set = type === 'skill' ? appState.selectedSkills : appState.selectedInterests;
  const container = document.getElementById(type === 'skill' ? 'selectedSkillsDisplay' : 'selectedInterestsDisplay');
  if (!container) return;

  if (set.size === 0) {
    container.innerHTML = `<span class="text-xs text-slate-500 italic">None selected yet. Click from catalog below or add custom.</span>`;
    return;
  }

  container.innerHTML = Array.from(set).map(item => `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 text-xs">
      ${item}
      <button type="button" onclick="removeMultiItem('${type}', '${item}')" class="text-indigo-400 hover:text-white">&times;</button>
    </span>
  `).join('');
}

function removeMultiItem(type, val) {
  const set = type === 'skill' ? appState.selectedSkills : appState.selectedInterests;
  set.delete(val);
  updateSelectedPills(type);
  // Also uncheck button if visible
  const buttons = document.querySelectorAll(type === 'skill' ? '#skillOptionsContainer button' : '#interestOptionsContainer button');
  buttons.forEach(btn => {
    if (btn.innerText.includes(val)) {
      btn.classList.remove('tag-selected');
      btn.innerText = `+ ${val}`;
    }
  });
}

function addCustomMultiItem(type) {
  const input = document.getElementById(type === 'skill' ? 'customSkillInput' : 'customInterestInput');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  const set = type === 'skill' ? appState.selectedSkills : appState.selectedInterests;
  set.add(val);
  input.value = '';
  updateSelectedPills(type);
}

// Open Register Intern Modal
function openRegisterInternModal() {
  appState.selectedSkills.clear();
  appState.selectedInterests.clear();
  updateSelectedPills('skill');
  updateSelectedPills('interest');
  initMultiSelectWidgets();
  openModal('registerInternModal');
}

// Submit Register Intern Form
async function handleRegisterInternSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  // Append multi-select arrays
  Array.from(appState.selectedSkills).forEach(s => formData.append('technicalSkills', s));
  Array.from(appState.selectedInterests).forEach(i => formData.append('areaOfInterest', i));

  try {
    const res = await apiCall('/interns', {
      method: 'POST',
      body: formData
    });

    showToast(`Intern account created: ${res.intern.fullName} (${res.intern.internId})`, 'success');
    closeModal('registerInternModal');
    form.reset();
    if (appState.activeTab === 'interns') {
      renderInternsTable();
    }
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Create Project Modal
function openCreateProjectModal() {
  openModal('createProjectModal');
}

// Submit Create Project Form
async function handleCreateProjectSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    projectName: form.projectName.value.trim(),
    category: form.projectCategory.value,
    startDate: form.projectStartDate.value,
    deadline: form.projectDeadline.value,
    projectStatus: form.projectStatus.value,
    description: form.projectDescription.value.trim(),
    objectives: form.projectObjectives.value.trim(),
    requirements: form.projectRequirements.value.trim()
  };

  try {
    const res = await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    showToast(`Project created: ${res.project.projectName} (${res.project.projectId})`, 'success');
    closeModal('createProjectModal');
    form.reset();
    if (appState.activeTab === 'projects') {
      renderProjectsGrid();
    }
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Project Details Modal
async function viewProjectDetails(projectId) {
  try {
    const res = await apiCall(`/projects/${projectId}`);
    const p = res.project;

    document.getElementById('modalPrjName').innerText = p.projectName;
    document.getElementById('modalPrjId').innerText = p.projectId;
    document.getElementById('modalPrjCategory').innerText = p.category;
    document.getElementById('modalPrjStatus').innerText = p.projectStatus;
    document.getElementById('modalPrjStartDate').innerText = p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A';
    document.getElementById('modalPrjDeadline').innerText = p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/A';
    document.getElementById('modalPrjDescription').innerText = p.description || 'No description provided.';
    document.getElementById('modalPrjObjectives').innerText = p.objectives || 'No objectives stated.';
    document.getElementById('modalPrjRequirements').innerText = p.requirements || 'No specific requirements listed.';

    // Team Members
    const teamContainer = document.getElementById('modalPrjTeamContainer');
    if ((p.teamMembers || []).length === 0) {
      teamContainer.innerHTML = `<span class="text-xs text-amber-400">No interns assigned yet.</span>`;
    } else {
      teamContainer.innerHTML = p.teamMembers.map(m => `
        <div class="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px]">
              ${m.fullName.charAt(0)}
            </div>
            <div>
              <div class="font-semibold text-slate-200">${m.fullName} (${m.internId})</div>
              <div class="text-[10px] text-slate-400">${m.designation}</div>
            </div>
          </div>
          ${appState.user && appState.user.role === 'admin' ? `
            <button onclick="removeTeamMember('${p.projectId}', '${m.internId}')" class="text-rose-400 hover:text-rose-300 text-xs">Remove</button>
          ` : ''}
        </div>
      `).join('');
    }

    // Modal Actions (Admin vs Intern)
    const actionsContainer = document.getElementById('modalPrjActionsContainer');
    if (actionsContainer) {
      const safeProjectName = (p.projectName || '').replace(/'/g, "\\'");
      if (appState.user && appState.user.role === 'admin') {
        actionsContainer.innerHTML = `
          <button onclick="handleDeleteProject('${p.projectId}', '${safeProjectName}')" class="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete Project
          </button>
          <div class="flex items-center gap-2">
            <button onclick="assignToThisProject('${p.projectId}')" class="px-3.5 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition flex items-center gap-1.5">
              + Assign Members
            </button>
            <button onclick="closeModal('projectDetailsModal')" class="btn-secondary px-4 py-2 rounded-lg text-xs font-medium">Close</button>
          </div>
        `;
      } else {
        actionsContainer.innerHTML = `
          <button onclick="internSubmitForProject('${p.projectId}')" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Submit Weekly Report
          </button>
          <button onclick="closeModal('projectDetailsModal')" class="btn-secondary px-4 py-2 rounded-lg text-xs font-medium">Close</button>
        `;
      }
    }

    openModal('projectDetailsModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function assignToThisProject(projectId) {
  closeModal('projectDetailsModal');
  switchAdminTab('assign');
  setTimeout(() => {
    const select = document.getElementById('assignProjectSelect');
    if (select) {
      select.value = projectId;
      select.dispatchEvent(new Event('change'));
    }
  }, 100);
}

function internSubmitForProject(projectId) {
  closeModal('projectDetailsModal');
  switchInternTab('submit_report');
  setTimeout(() => {
    const select = document.getElementById('submitReportProjectSelect');
    if (select) {
      select.value = projectId;
    }
  }, 150);
}

// Remove Team Member
async function removeTeamMember(projectId, internId) {
  if (!confirm(`Remove intern ${internId} from project ${projectId}?`)) return;
  try {
    const asgRes = await apiCall('/assignments');
    const target = asgRes.assignments.find(a => a.projectId === projectId && a.internId === internId);
    if (!target) throw new Error('Assignment record not found.');

    await apiCall(`/assignments/${target.assignmentId}`, { method: 'DELETE' });
    showToast('Intern removed from project.', 'success');
    viewProjectDetails(projectId);
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Assign Projects Page
async function renderAssignProjectsPage() {
  try {
    const [prjRes, intRes] = await Promise.all([
      apiCall('/projects'),
      apiCall('/interns')
    ]);

    const projectSelect = document.getElementById('assignProjectSelect');
    projectSelect.innerHTML = `<option value="">-- Choose Project --</option>` +
      prjRes.projects.map(p => `<option value="${p.projectId}">${p.projectName} (${p.projectId}) - [${p.projectStatus}]</option>`).join('');

    appState.internsList = intRes.interns || [];
    renderAssignInternsList(appState.internsList);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAssignInternsList(interns) {
  const container = document.getElementById('assignInternsListContainer');
  if (!container) return;

  if (interns.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">No interns registered yet. Please register an intern first.</div>`;
    return;
  }

  container.innerHTML = interns.map(i => `
    <label class="flex items-start gap-3 p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 transition cursor-pointer">
      <input type="checkbox" value="${i.internId}" onchange="toggleSelectInternForAssign('${i.internId}', this)" class="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500">
      <div class="flex-1 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-slate-200 text-sm">${i.fullName}</span>
          <span class="${i.availabilityStatus === 'Available' ? 'badge-active' : 'badge-completed'} px-2 py-0.5 rounded text-[10px] font-mono">
            ${i.availabilityStatus}
          </span>
        </div>
        <div class="text-slate-400 text-[11px] font-mono mt-0.5">${i.internId} · ${i.email}</div>
        <div class="text-indigo-300 font-medium text-[11px] mt-1">${i.designation}</div>
        <div class="text-slate-400 text-[11px] mt-0.5">${i.collegeName || 'N/A'} · ${i.department || 'N/A'}</div>
        <div class="flex flex-wrap gap-1 mt-2">
          ${(i.technicalSkills || []).slice(0, 4).map(s => `
            <span class="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">${s}</span>
          `).join('')}
        </div>
      </div>
    </label>
  `).join('');
}

function toggleSelectInternForAssign(id, cb) {
  if (cb.checked) {
    appState.selectedInternsForAssignment.add(id);
  } else {
    appState.selectedInternsForAssignment.delete(id);
  }
  document.getElementById('selectedInternsCount').innerText = appState.selectedInternsForAssignment.size;
}

// Execute Project Assignment
async function handleExecuteAssignment() {
  const projectId = document.getElementById('assignProjectSelect').value;
  if (!projectId) {
    showToast('Please select a project to assign.', 'error');
    return;
  }

  const internIds = Array.from(appState.selectedInternsForAssignment);
  if (internIds.length === 0) {
    showToast('Please check at least one intern to assign.', 'error');
    return;
  }

  try {
    const res = await apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify({ projectId, internIds })
    });

    let msg = res.message;
    if (res.emailNotifications && res.emailNotifications.length > 0) {
      msg += ` Automated assignment notification dispatched to ${res.emailNotifications.length} intern email(s).`;
    }

    showToast(msg, 'success');
    appState.selectedInternsForAssignment.clear();
    document.getElementById('selectedInternsCount').innerText = '0';
    renderAssignProjectsPage();
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Interns Table (Admin)
async function renderInternsTable() {
  const container = document.getElementById('internsTableBody');
  if (!container) return;

  try {
    const res = await apiCall('/interns');
    const interns = res.interns || [];

    if (interns.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 text-xs">No registered interns found. Click "+ Register New Intern" to add one.</td></tr>`;
      return;
    }

    container.innerHTML = interns.map(i => `
      <tr class="hover:bg-slate-800/40 transition text-xs">
        <td class="px-4 py-3.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
              ${i.profileImage ? `<img src="${i.profileImage}" class="w-full h-full rounded-full object-cover">` : i.fullName.charAt(0)}
            </div>
            <div>
              <div class="font-semibold text-slate-200">${i.fullName}</div>
              <div class="text-[10px] text-slate-400 font-mono">${i.internId}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3.5 font-medium text-indigo-300">${i.designation}</td>
        <td class="px-4 py-3.5 text-slate-300 font-mono text-[11px]">${i.email}</td>
        <td class="px-4 py-3.5 text-slate-400">${i.collegeName || 'N/A'}</td>
        <td class="px-4 py-3.5">
          <div class="flex flex-wrap gap-1 max-w-[200px]">
            ${(i.technicalSkills || []).slice(0, 3).map(s => `<span class="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">${s}</span>`).join('')}
            ${(i.technicalSkills || []).length > 3 ? `<span class="text-[10px] text-slate-500">+${i.technicalSkills.length - 3}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3.5">
          <span class="${i.availabilityStatus === 'Available' ? 'badge-active' : 'badge-completed'} px-2 py-0.5 rounded text-[10px] font-mono">
            ${i.availabilityStatus} (${i.activeProjectsCount})
          </span>
        </td>
        <td class="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
          <button onclick="openResetPasswordModal('${i.internId}', '${(i.fullName || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium transition inline-flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            Reset Pwd
          </button>
          <button onclick="handleDeleteIntern('${i.internId}', '${(i.fullName || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-xs rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-semibold transition inline-flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Reset Password Modal
function openResetPasswordModal(internId, name) {
  document.getElementById('resetInternIdHidden').value = internId;
  document.getElementById('resetInternNameSpan').innerText = `${name} (${internId})`;
  openModal('resetPasswordModal');
}

async function handleResetPasswordSubmit(e) {
  e.preventDefault();
  const internId = document.getElementById('resetInternIdHidden').value;
  const newPassword = document.getElementById('newInternPasswordInput').value;

  try {
    const res = await apiCall(`/interns/${internId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });
    showToast(res.message, 'success');
    closeModal('resetPasswordModal');
    document.getElementById('newInternPasswordInput').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Intern
async function handleDeleteIntern(internId, name) {
  if (!confirm(`Are you sure you want to permanently delete intern "${name}" (${internId})?\n\nThis will remove the intern account, release all their project assignments, and purge their submission records.`)) return;
  try {
    const res = await apiCall(`/interns/${internId}`, { method: 'DELETE' });
    showToast(res.message || 'Intern deleted successfully.', 'success');
    renderInternsTable();
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Projects Grid (Admin)
async function renderProjectsGrid() {
  const container = document.getElementById('projectsGridContainer');
  if (!container) return;

  try {
    const res = await apiCall('/projects');
    const projects = res.projects || [];

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-12 text-center text-slate-500">
          <p class="text-sm">No projects created yet.</p>
          <button onclick="openCreateProjectModal()" class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500">+ Create First Project</button>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => {
      const safeProjectName = (p.projectName || '').replace(/'/g, "\\'");
      return `
      <div class="glass-card rounded-xl p-5 border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">${p.projectId}</span>
              <h3 class="text-base font-bold text-slate-100 mt-1.5">${p.projectName}</h3>
            </div>
            <span class="${p.projectStatus === 'Active' ? 'badge-active' : p.projectStatus === 'Completed' ? 'badge-completed' : 'badge-pending'} px-2 py-0.5 rounded text-[10px] font-mono">
              ${p.projectStatus}
            </span>
          </div>

          <p class="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">${p.description || 'No description provided.'}</p>

          <div class="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-[10px] text-slate-500 block uppercase font-semibold">Category</span>
              <span class="font-medium text-slate-300">${p.category}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block uppercase font-semibold">Deadline</span>
              <span class="font-medium text-slate-300">${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div class="flex items-center -space-x-1.5">
            ${(p.teamMembers || []).slice(0, 3).map(m => `
              <div class="w-6 h-6 rounded-full bg-indigo-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow" title="${m.fullName}">
                ${m.fullName.charAt(0)}
              </div>
            `).join('')}
            ${(p.teamMembers || []).length > 3 ? `<span class="text-[10px] text-slate-400 pl-2 font-medium">+${p.teamMembers.length - 3}</span>` : ''}
            ${(p.teamMembers || []).length === 0 ? `<span class="text-[11px] text-amber-400">Unassigned</span>` : ''}
          </div>

          <div class="flex items-center gap-2">
            <button onclick="viewProjectDetails('${p.projectId}')" class="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              About Project
            </button>
            <button onclick="handleDeleteProject('${p.projectId}', '${safeProjectName}')" class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1" title="Delete Project">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeleteProject(projectId, name) {
  if (!confirm(`Are you sure you want to permanently delete project "${name}" (${projectId})?\n\nThis will remove the project, unassign all team members, and delete all associated reports.`)) return;
  try {
    const res = await apiCall(`/projects/${projectId}`, { method: 'DELETE' });
    showToast(res.message || 'Project deleted successfully.', 'success');
    closeModal('projectDetailsModal');
    renderProjectsGrid();
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Reports Table (Admin)
async function renderReportsTable() {
  const container = document.getElementById('reportsTableBody');
  if (!container) return;

  try {
    const res = await apiCall('/reports');
    const reports = res.reports || [];

    if (reports.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 text-xs">No reports submitted yet.</td></tr>`;
      return;
    }

    container.innerHTML = reports.map(r => `
      <tr class="hover:bg-slate-800/40 transition text-xs">
        <td class="px-4 py-3.5">
          <div class="font-semibold text-slate-200">${r.reportTitle}</div>
          <div class="text-[10px] text-slate-400 font-mono">${r.reportId} · Week ${r.weekNumber} (${r.month} ${r.year})</div>
        </td>
        <td class="px-4 py-3.5 font-medium text-indigo-300">${r.projectName}</td>
        <td class="px-4 py-3.5 text-slate-300">${r.internName} <span class="text-[10px] text-slate-400">(${r.internId})</span></td>
        <td class="px-4 py-3.5 font-mono">${r.workProgress || 0}%</td>
        <td class="px-4 py-3.5">
          <span class="${r.submissionStatus === 'Approved' ? 'badge-active' : r.submissionStatus === 'Rejected' ? 'badge-rejected' : 'badge-pending'} px-2 py-0.5 rounded text-[10px] font-mono">
            ${r.submissionStatus}
          </span>
        </td>
        <td class="px-4 py-3.5 text-slate-400">${new Date(r.submittedAt).toLocaleDateString()}</td>
        <td class="px-4 py-3.5 text-right">
          <button onclick="openReviewReportModal('${r.reportId}')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium">Review</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Review Report Modal
async function openReviewReportModal(reportId) {
  try {
    const res = await apiCall(`/reports/${reportId}`);
    const r = res.report;

    document.getElementById('reviewReportIdHidden').value = r.reportId;
    document.getElementById('reviewReportTitle').innerText = r.reportTitle;
    document.getElementById('reviewReportSubtitle').innerText = `${r.internName} (${r.internId}) · Project: ${r.projectName} · Week ${r.weekNumber} (${r.month} ${r.year})`;
    document.getElementById('reviewWorkSummary').innerText = r.workSummary || 'No summary provided.';
    document.getElementById('reviewCompletedActivities').innerText = r.completedActivities || 'None specified.';
    document.getElementById('reviewChallenges').innerText = r.challengesFaced || 'None reported.';
    document.getElementById('reviewNextWeekPlan').innerText = r.nextWeekPlan || 'None specified.';
    document.getElementById('reviewCommentsInput').value = r.reviewComments || '';

    // Files list
    const fileContainer = document.getElementById('reviewReportFilesContainer');
    if ((r.uploadedFiles || []).length === 0) {
      fileContainer.innerHTML = `<span class="text-xs text-slate-500 italic">No files attached.</span>`;
    } else {
      fileContainer.innerHTML = r.uploadedFiles.map(f => `
        <a href="${f.fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs border border-slate-700">
          📄 ${f.originalFileName}
        </a>
      `).join('');
    }

    openModal('reviewReportModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleReviewReportAction(status) {
  const reportId = document.getElementById('reviewReportIdHidden').value;
  const comments = document.getElementById('reviewCommentsInput').value.trim();

  try {
    const res = await apiCall(`/reports/${reportId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments })
    });

    showToast(res.message, 'success');
    closeModal('reviewReportModal');
    if (appState.activeTab === 'reports') {
      renderReportsTable();
    }
    fetchAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Excel Export Functions
function triggerExcelExport(type) {
  const url = `${API_BASE}/export/${type}`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Phoenix_${type}.xlsx`);
  // Add auth header via token URL param or direct fetch blob
  fetch(url, {
    headers: { 'Authorization': `Bearer ${appState.token}` }
  })
  .then(res => res.blob())
  .then(blob => {
    const blobUrl = window.URL.createObjectURL(blob);
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Excel export for ${type} generated and downloaded!`, 'success');
  })
  .catch(err => showToast('Export failed: ' + err.message, 'error'));
}

// ==========================================
// INTERN PORTAL WORKFLOWS
// ==========================================
async function renderInternDashboard() {
  try {
    const [prjRes, repRes] = await Promise.all([
      apiCall('/projects'),
      apiCall('/reports')
    ]);

    const projects = prjRes.projects || [];
    const reports = repRes.reports || [];

    document.getElementById('internStatProjects').innerText = projects.length;
    document.getElementById('internStatReports').innerText = reports.length;
    document.getElementById('internStatApproved').innerText = reports.filter(r => r.submissionStatus === 'Approved').length;
    document.getElementById('internStatPending').innerText = reports.filter(r => r.submissionStatus === 'Submitted').length;

    // Render assigned project cards
    const prjContainer = document.getElementById('internProjectsGrid');
    if (projects.length === 0) {
      prjContainer.innerHTML = `
        <div class="col-span-full p-8 text-center glass-card rounded-xl border border-slate-800">
          <p class="text-sm text-slate-400">You do not have any assigned projects at this time.</p>
          <p class="text-xs text-slate-500 mt-1">Your administrator will assign projects based on your profile skills.</p>
        </div>
      `;
    } else {
      prjContainer.innerHTML = projects.map(p => `
        <div class="glass-card rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">${p.projectId}</span>
              <span class="badge-active px-2 py-0.5 rounded text-[10px] font-mono">${p.projectStatus}</span>
            </div>
            <h3 class="text-base font-bold text-slate-100 mt-2">${p.projectName}</h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">${p.description || 'No description provided.'}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div class="text-[11px] text-slate-400">Deadline: <span class="text-slate-200 font-medium">${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/A'}</span></div>
            <button onclick="viewProjectDetails('${p.projectId}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              About Project
            </button>
          </div>
        </div>
      `).join('');
    }

    // Populate intern project select in report submission form
    const select = document.getElementById('submitReportProjectSelect');
    if (select) {
      select.innerHTML = `<option value="">-- Choose Assigned Project --</option>` +
        projects.map(p => `<option value="${p.projectId}">${p.projectName} (${p.projectId})</option>`).join('');
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Dynamic Calendar Breakdown for Intern Reporting
async function loadInternReportingCalendar() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  try {
    const res = await apiCall(`/reports/calendar/${currentYear}/${currentMonth}`);
    const weeksContainer = document.getElementById('reportingWeeksSelector');
    if (!weeksContainer) return;

    weeksContainer.innerHTML = res.weeks.map(w => `
      <label class="flex items-center gap-2.5 p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-indigo-500 cursor-pointer">
        <input type="radio" name="reportingWeek" value="${w.weekNumber}" ${w.weekNumber === 1 ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500">
        <div class="text-xs">
          <div class="font-semibold text-slate-200">${w.label}</div>
          <div class="text-[10px] text-slate-400">Reporting Cycle: ${res.month} ${res.year}</div>
        </div>
      </label>
    `).join('');

    document.getElementById('reportMonthHidden').value = res.month;
    document.getElementById('reportYearHidden').value = res.year;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Handle Report Submission (Intern)
async function handleSubmitReport(isDraft = false) {
  const form = document.getElementById('reportSubmissionForm');
  const formData = new FormData(form);

  const selectedWeek = document.querySelector('input[name="reportingWeek"]:checked');
  if (selectedWeek) {
    formData.append('weekNumber', selectedWeek.value);
  }

  formData.append('submissionStatus', isDraft ? 'Draft' : 'Submitted');

  try {
    const res = await apiCall('/reports', {
      method: 'POST',
      body: formData
    });

    showToast(res.message, 'success');
    form.reset();
    switchInternTab('my_reports');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Intern Submissions Table
async function renderInternSubmissions() {
  const container = document.getElementById('internSubmissionsContainer');
  if (!container) return;

  try {
    const res = await apiCall('/reports');
    const reports = res.reports || [];

    if (reports.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs">You have not submitted any reports yet. Click "Submit Reports" to begin.</div>`;
      return;
    }

    container.innerHTML = reports.map(r => `
      <div class="glass-card rounded-xl p-5 border border-slate-800">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold text-slate-100">${r.reportTitle}</h4>
              <span class="${r.submissionStatus === 'Approved' ? 'badge-active' : r.submissionStatus === 'Rejected' ? 'badge-rejected' : 'badge-pending'} px-2 py-0.5 rounded text-[10px] font-mono">
                ${r.submissionStatus}
              </span>
            </div>
            <div class="text-xs text-indigo-400 font-mono mt-0.5">${r.projectName} · Week ${r.weekNumber} (${r.month} ${r.year})</div>
          </div>
          <span class="text-xs text-slate-400 font-mono">${new Date(r.submittedAt).toLocaleDateString()}</span>
        </div>

        <p class="text-xs text-slate-300 mt-3 line-clamp-3">${r.workSummary || 'No summary provided.'}</p>

        ${r.reviewComments ? `
          <div class="mt-3 p-2.5 rounded bg-slate-900/80 border-l-2 border-indigo-500 text-xs text-slate-300">
            <strong class="text-indigo-300">Admin Review:</strong> "${r.reviewComments}"
          </div>
        ` : ''}

        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div class="text-slate-400">Reported Progress: <strong class="text-slate-200 font-mono">${r.workProgress}%</strong></div>
          ${(r.uploadedFiles || []).length > 0 ? `
            <div class="flex gap-2">
              ${r.uploadedFiles.map(f => `<a href="${f.fileUrl}" target="_blank" class="text-indigo-400 hover:text-indigo-300 text-xs">📄 ${f.originalFileName}</a>`).join('')}
            </div>
          ` : '<span class="text-slate-500 text-[11px]">No attachments</span>'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Tab Contents Dynamically
function renderAdminTabContent(tab) {
  document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`adminTab-${tab}`);
  if (target) target.classList.remove('hidden');

  if (tab === 'dashboard') fetchAdminOverview();
  if (tab === 'interns') renderInternsTable();
  if (tab === 'projects') renderProjectsGrid();
  if (tab === 'assign') renderAssignProjectsPage();
  if (tab === 'reports') renderReportsTable();
  if (tab === 'profile') loadAdminProfileForm();
}

function renderInternTabContent(tab) {
  document.querySelectorAll('.intern-tab-pane').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`internTab-${tab}`);
  if (target) target.classList.remove('hidden');

  if (tab === 'dashboard') renderInternDashboard();
  if (tab === 'submit_report') loadInternReportingCalendar();
  if (tab === 'my_reports') renderInternSubmissions();
  if (tab === 'profile') loadInternProfileView();
}

// Load Profile Forms
function loadAdminProfileForm() {
  if (!appState.user) return;
  const u = appState.user;
  document.getElementById('adminProfileName').value = u.name || '';
  document.getElementById('adminProfileId').value = u.adminId || '';
  document.getElementById('adminProfileEmail').value = u.email || '';
  document.getElementById('adminProfilePhone').value = u.contactNumber || '';
  document.getElementById('adminProfileDesignation').value = u.designation || '';
  document.getElementById('adminProfileDept').value = u.department || '';
}

async function handleUpdateAdminProfile(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('adminProfileName').value,
    contactNumber: document.getElementById('adminProfilePhone').value,
    designation: document.getElementById('adminProfileDesignation').value,
    department: document.getElementById('adminProfileDept').value
  };

  try {
    const res = await apiCall('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    appState.user = { ...appState.user, ...res.admin };
    localStorage.setItem('pts_user', JSON.stringify(appState.user));
    showToast('Admin profile updated.', 'success');
    renderSidebarUserInfo();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function loadInternProfileView() {
  if (!appState.user) return;
  const u = appState.user;
  document.getElementById('internProfFullName').innerText = u.fullName || u.name || '';
  document.getElementById('internProfId').innerText = u.internId || '';
  document.getElementById('internProfEmail').innerText = u.email || '';
  document.getElementById('internProfPhone').value = u.phoneNumber || '';
  document.getElementById('internProfDesignation').innerText = u.designation || '';
  document.getElementById('internProfCollege').innerText = u.collegeName || 'N/A';
  document.getElementById('internProfDept').innerText = u.department || 'N/A';

  const skillsContainer = document.getElementById('internProfSkillsDisplay');
  if (skillsContainer) {
    skillsContainer.innerHTML = (u.technicalSkills || []).map(s => `
      <span class="px-2 py-0.5 rounded bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs">${s}</span>
    `).join('') || '<span class="text-xs text-slate-500 italic">No skills recorded.</span>';
  }
}

async function handleUpdateInternContact(e) {
  e.preventDefault();
  const phoneNumber = document.getElementById('internProfPhone').value;
  try {
    const res = await apiCall(`/interns/${appState.user.internId}`, {
      method: 'PUT',
      body: JSON.stringify({ phoneNumber })
    });
    appState.user = { ...appState.user, ...res.intern };
    localStorage.setItem('pts_user', JSON.stringify(appState.user));
    showToast('Contact information updated.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Top/Sidebar User Info
function renderSidebarUserInfo() {
  if (!appState.user) return;
  const u = appState.user;

  if (u.role === 'admin') {
    document.getElementById('sidebarAdminName').innerText = u.name;
    document.getElementById('sidebarAdminId').innerText = u.adminId;
    document.getElementById('sidebarAdminDesignation').innerText = u.designation || 'Administrator';
    document.getElementById('headerAdminName').innerText = u.name;
    document.getElementById('headerAdminBadge').innerText = u.name.split(' ').map(n=>n[0]).join('').slice(0, 2);
    document.getElementById('sidebarAdminInitials').innerText = u.name.split(' ').map(n=>n[0]).join('').slice(0, 2);
  } else {
    document.getElementById('sidebarInternName').innerText = u.fullName || u.name;
    document.getElementById('sidebarInternId').innerText = u.internId;
    document.getElementById('sidebarInternDesignation').innerText = u.designation || 'Intern';
    document.getElementById('sidebarInternInitials').innerText = (u.fullName || u.name).split(' ').map(n=>n[0]).join('').slice(0, 2);
  }
}

// Main Render Router
function renderPortal() {
  const loginView = document.getElementById('loginView');
  const adminPortal = document.getElementById('adminPortal');
  const internPortal = document.getElementById('internPortal');

  if (!appState.token || !appState.user) {
    loginView.classList.remove('hidden');
    adminPortal.classList.add('hidden');
    internPortal.classList.add('hidden');
    selectLoginRole('admin');
  } else if (appState.user.role === 'admin') {
    loginView.classList.add('hidden');
    adminPortal.classList.remove('hidden');
    internPortal.classList.add('hidden');
    renderSidebarUserInfo();
    switchAdminTab('dashboard');
    fetchNotifications();
  } else if (appState.user.role === 'intern') {
    loginView.classList.add('hidden');
    adminPortal.classList.add('hidden');
    internPortal.classList.remove('hidden');
    renderSidebarUserInfo();
    switchInternTab('dashboard');
    fetchNotifications();
  }
}

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  renderPortal();
  initSocket();
});
