/* ---------- force hard navigation for sidebar ---------- */
document.addEventListener('click', function (e) {
  const a = e.target.closest('a[data-force-nav]');
  if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  window.location.href = a.href;
}, true);

/* ---------- Supabase API Helper ---------- */
const API_URL = '/reso-management-system/project-manager/assets/php/project-api.php';


async function apiRequest(action, data = null) {
  const url = `${API_URL}?action=${action}`;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  };
  if (data) options.body = JSON.stringify(data);

  // SHOW LOADING
  Swal.fire({
    title: 'Loading...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const response = await fetch(url, options);

    // Handle unauthorized
    if (response.status === 401) {
      Swal.close();
      await Swal.fire({
        icon: 'error',
        title: 'Session Expired',
        text: 'Please login again.',
        confirmButtonColor: '#1a1a1a'
      });
      window.location.href = '../controllers/AuthController.php?action=logout';
      throw new Error('Unauthorized');
    }

    const result = await response.json();
    Swal.close(); // CLOSE LOADING

    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;

  } catch (err) {
    Swal.close();
    Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    throw err;
  }
}


let allProjects = [];
let currentUser = null;

/* ---------- Load user info ---------- */
async function loadUserInfo() {
  try {
    currentUser = await apiRequest('getUserInfo');
    
    // Update sidebar with user info
    const sidebarHeader = document.querySelector('.sidebar-header p');
    if (sidebarHeader && currentUser) {
      sidebarHeader.textContent = currentUser.name;
    }
    
    console.log('Logged in as:', currentUser.name, '(ID:', currentUser.id, ')');
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

/* ---------- Load projects from database ---------- */
async function loadProjects() {
  try {
    allProjects = await apiRequest('getAll');
    render();
  } catch (error) {
    console.error('Error loading projects:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load projects: ' + error.message
    });
  }
}

/* ---------- helpers ---------- */
function nowISO() { return new Date().toISOString().slice(0, 10); }
function percentage(p) { return p.total_resources_needed ? Math.round((p.assigned_resources / p.total_resources_needed) * 100) : 0; }
function progressClass(pct) { return pct >= 100 ? 'full' : (pct >= 50 ? 'partial' : ''); }
function badgeByStatus(s) { 
  if (s === 'active') return ['success', 'Active']; 
  if (s === 'pending') return ['warning', 'Pending']; 
  if (s === 'completed') return ['info', 'Completed'];
  return ['secondary', s]; 
}
function fmtDate(s) { 
  if (!s) return '—'; 
  const d = new Date(s); 
  return isNaN(d) ? '—' : d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }); 
}
function escapeHtml(str) { 
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s])); 
}

/* ---------- render ---------- */
function createProjectCard(p) {
  const pct = percentage(p);
  const pClass = progressClass(pct);
  const [badgeClass, badgeText] = badgeByStatus(p.status);
  const dateLabel = p.status === 'completed' ? 'Completed' : (p.status === 'pending' ? 'Requested' : 'Start');
  const dateValue = p.status === 'completed' ? fmtDate(p.completed_at) : (p.status === 'pending' ? fmtDate(p.created_at) : fmtDate(p.start_date));

  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.id = p.id;

  // Project Header
  const header = document.createElement('div');
  header.className = 'project-header';

  const titleDiv = document.createElement('div');
  const title = document.createElement('h3');
  title.className = 'project-title';
  title.textContent = p.project_name || 'Untitled Project';
  
  const badge = document.createElement('span');
  badge.className = `badge badge-${badgeClass}`;
  badge.textContent = badgeText;
  
  titleDiv.appendChild(title);
  titleDiv.appendChild(badge);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  
  if (p.status !== 'pending' && p.status !== 'completed') {
    const reqBtn = document.createElement('button');
    reqBtn.className = 'btn btn-ghost btn-sm';
    reqBtn.innerHTML = '<i class="fas fa-user-plus"></i> Request Resources';
    reqBtn.onclick = () => openRequestModal(p.id);
    actions.appendChild(reqBtn);
  }
  
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-sm btn-secondary';
  viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
  viewBtn.onclick = () => viewProject(p.id);
  actions.appendChild(viewBtn);

  header.appendChild(titleDiv);
  header.appendChild(actions);

  // Project Meta
  const meta = document.createElement('div');
  meta.className = 'project-meta';
  
  // Show project manager info if available
  const managerInfo = p.project_manager ? ` | PM: ${escapeHtml(p.project_manager.name)}` : '';
  
  meta.innerHTML = `
    <div class="project-meta-item"><i class="fas fa-calendar"></i><span>${dateLabel}: ${dateValue}</span></div>
    <div class="project-meta-item"><i class="fas fa-clock"></i><span>Duration: ${escapeHtml(p.duration || '—')}</span></div>
    <div class="project-meta-item"><i class="fas fa-flag"></i><span>Priority: ${escapeHtml(p.priority || '—')}</span></div>
    ${managerInfo ? `<div class="project-meta-item"><i class="fas fa-user"></i><span>${managerInfo}</span></div>` : ''}
  `;

  // Resource Progress or Info
  let progressDiv;
  if (p.status !== 'pending') {
    progressDiv = document.createElement('div');
    progressDiv.className = 'resource-progress';
    progressDiv.innerHTML = `
      <div class="progress-label">
        <span><strong>Resource Allocation:</strong></span>
        <span>${Number(p.assigned_resources) || 0} / ${Number(p.total_resources_needed) || 0} assigned (${pct}%)</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar ${pClass}" style="width:${Math.min(pct, 100)}%"></div>
      </div>
    `;
  } else {
    progressDiv = document.createElement('div');
    progressDiv.className = 'project-meta';
    progressDiv.innerHTML = `
      <div class="project-meta-item">
        <i class="fas fa-users"></i><span>Resources Needed: ${Number(p.total_resources_needed) || 0}</span>
      </div>
    `;
  }

  // History
  const history = document.createElement('div');
  history.className = 'history';
  
  const historyTitle = document.createElement('h4');
  historyTitle.innerHTML = '<i class="fas fa-clock-rotate-left"></i> History';
  
  const historyList = document.createElement('ul');
  if (p.history && p.history.length > 0) {
    p.history.slice().reverse().forEach(h => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i class="fas fa-circle" style="font-size:6px;"></i>
        <span>${escapeHtml(h.event)}</span>
        <time>— ${fmtDate(h.ts)}</time>
      `;
      historyList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<em>No history yet.</em>';
    historyList.appendChild(li);
  }
  
  history.appendChild(historyTitle);
  history.appendChild(historyList);

  // Assemble card
  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(progressDiv);
  card.appendChild(history);

  return card;
}

function fillTab(id, items, emptyMsg) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'text-center';
    empty.style.padding = '40px';
    empty.innerHTML = `
      <i class="fas fa-folder-open" style="font-size:48px;color:var(--medium-gray);margin-bottom:15px;"></i>
      <p style="color:var(--text-gray);">${emptyMsg}</p>
    `;
    el.appendChild(empty);
    return;
  }
  
  items.forEach(project => {
    el.appendChild(createProjectCard(project));
  });
}

function render() {
  const counts = {
    all: allProjects.length,
    active: allProjects.filter(p => p.status === 'active').length,
    pending: allProjects.filter(p => p.status === 'pending').length,
    completed: allProjects.filter(p => p.status === 'completed').length
  };
  
  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-active').textContent = counts.active;
  document.getElementById('count-pending').textContent = counts.pending;
  document.getElementById('count-completed').textContent = counts.completed;

  fillTab('all-tab', allProjects, 'No projects yet. Click "New Project" to get started.');
  fillTab('active-tab', allProjects.filter(p => p.status === 'active'), 'No active projects.');
  fillTab('pending-tab', allProjects.filter(p => p.status === 'pending'), 'No pending projects.');
  fillTab('completed-tab', allProjects.filter(p => p.status === 'completed'), 'No completed projects yet.');
}

/* ---------- tabs ---------- */
function switchTab(btn, tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

/* ---------- NEW PROJECT MODAL (dynamic rows) ---------- */
function openNewProjectModal() { 
  document.getElementById('newProjectModal').classList.add('active'); 
}

function closeNewProjectModal() {
  document.getElementById('newProjectModal').classList.remove('active');
  const f = document.getElementById('newProjectForm');
  if (f) f.reset();
  const container = document.getElementById('resourceContainer');
  if (container) {
    [...container.querySelectorAll('.resource-row')].forEach((row, i) => { 
      if (i > 0) row.remove(); 
    });
  }
}

function addResourceRow() {
  const c = document.getElementById('resourceContainer');
  const r = document.createElement('div');
  r.className = 'resource-row';
  r.innerHTML = `
    <div>
      <input type="text" class="form-control" name="resource_type[]" placeholder="e.g., QA Engineer" required>
    </div>
    <div>
      <input type="number" class="form-control" name="resource_count[]" min="1" value="1" required>
    </div>
    <div class="skills">
      <input type="text" class="form-control" name="required_skills[]" placeholder="e.g., Cypress, Jest" required>
    </div>
    <button type="button" class="btn btn-danger btn-sm" onclick="removeResourceRow(this)" title="Remove row" style="height:44px;">
      <i class="fas fa-trash"></i>
    </button>`;
  c.appendChild(r);
}

function removeResourceRow(btn) {
  const c = document.getElementById('resourceContainer');
  const rows = c.querySelectorAll('.resource-row');
  if (rows.length > 1) {
    btn.closest('.resource-row').remove();
  } else {
    Swal.fire({ 
      icon: 'warning', 
      title: 'Cannot Remove', 
      text: 'At least one requirement row is needed.', 
      confirmButtonColor: '#1a1a1a' 
    });
  }
}

async function submitNewProject(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const types = fd.getAll('resource_type[]');
  const counts = fd.getAll('resource_count[]').map(n => Number(n) || 0);
  const skills = fd.getAll('required_skills[]');

  const resources = [];
  let totalNeeded = 0;
  for (let i = 0; i < types.length; i++) {
    resources.push({ type: types[i], count: counts[i], skills: skills[i] });
    totalNeeded += counts[i];
  }

  const projectData = {
    project_name: fd.get('project_name'),
    start_date: fd.get('start_date'),
    duration: fd.get('duration'),
    priority: fd.get('priority'),
    total_resources_needed: totalNeeded,
    notes: fd.get('notes') || '',
    resources
  };

  try {
    await apiRequest('create', projectData);
    closeNewProjectModal();
    await loadProjects();
    Swal.fire({ 
      icon: 'success', 
      title: 'Submitted', 
      text: 'New project request created and awaiting HR approval.', 
      confirmButtonColor: '#1a1a1a' 
    });
  } catch (error) {
    Swal.fire({ 
      icon: 'error', 
      title: 'Error', 
      text: 'Failed to create project: ' + error.message 
    });
  }
}

/* ---------- REQUEST RESOURCES MODAL (dynamic rows) ---------- */
let requestProjectId = null;

function openRequestModal(projectId) {
  const p = allProjects.find(x => x.id === projectId);
  if (!p) return;
  requestProjectId = p.id;
  
  const nameEl = document.getElementById('reqProjectName');
  if (nameEl) nameEl.textContent = p.project_name;

  const form = document.getElementById('requestForm');
  if (form) form.reset();
  
  const c = document.getElementById('reqResourceContainer');
  if (c) {
    [...c.querySelectorAll('.resource-row')].forEach((row, i) => { 
      if (i > 0) row.remove(); 
    });
  }

  document.getElementById('requestModal').classList.add('active');
}

function closeRequestModal() {
  document.getElementById('requestModal').classList.remove('active');
  requestProjectId = null;
}

function addReqRow() {
  const c = document.getElementById('reqResourceContainer');
  const r = document.createElement('div');
  r.className = 'resource-row';
  r.innerHTML = `
    <div>
      <input type="text" class="form-control" name="req_resource_type[]" placeholder="e.g., Backend Dev" required>
    </div>
    <div>
      <input type="number" class="form-control" name="req_resource_count[]" min="1" value="1" required>
    </div>
    <div class="skills">
      <input type="text" class="form-control" name="req_required_skills[]" placeholder="e.g., Node, SQL" required>
    </div>
    <button type="button" class="btn btn-danger btn-sm" onclick="removeReqRow(this)" title="Remove row" style="height:44px;">
      <i class="fas fa-trash"></i>
    </button>`;
  c.appendChild(r);
}

function removeReqRow(btn) {
  const c = document.getElementById('reqResourceContainer');
  const rows = c.querySelectorAll('.resource-row');
  if (rows.length > 1) {
    btn.closest('.resource-row').remove();
  } else {
    Swal.fire({ 
      icon: 'warning', 
      title: 'Cannot Remove', 
      text: 'At least one requirement row is needed.', 
      confirmButtonColor: '#1a1a1a' 
    });
  }
}

async function submitResourceRequest(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const types = fd.getAll('req_resource_type[]');
  const counts = fd.getAll('req_resource_count[]').map(n => Number(n) || 0);
  const skills = fd.getAll('req_required_skills[]');
  const reason = (fd.get('reason') || '').trim();

  const resources = [];
  for (let i = 0; i < types.length; i++) {
    resources.push({ type: types[i], count: counts[i], skills: skills[i] });
  }

  try {
    await apiRequest('requestResources', {
      project_id: requestProjectId,
      resources,
      reason
    });
    
    closeRequestModal();
    await loadProjects();
    Swal.fire({ 
      icon: 'success', 
      title: 'Request Submitted', 
      text: 'Your resource request has been logged for HR review.', 
      confirmButtonColor: '#1a1a1a' 
    });
  } catch (error) {
    Swal.fire({ 
      icon: 'error', 
      title: 'Error', 
      text: 'Failed to submit request: ' + error.message 
    });
  }
}

/* ---------- Complete Project ---------- */
async function completeProject(projectId) {
  const project = allProjects.find(p => p.id === projectId);
  if (!project) return;

  const result = await Swal.fire({
    title: 'Complete Project?',
    html: `Are you sure you want to mark "<strong>${escapeHtml(project.project_name)}</strong>" as completed?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, Complete It',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    await apiRequest('completeProject', { project_id: projectId });
    await loadProjects();
    Swal.fire({
      icon: 'success',
      title: 'Project Completed!',
      text: 'The project has been marked as completed.',
      confirmButtonColor: '#1a1a1a'
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to complete project: ' + error.message
    });
  }
}

/* ---------- View Project ---------- */
function viewProject(id) { 
  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  
  const resourcesList = project.resources && project.resources.length > 0
    ? project.resources.map(r => `• ${r.count}x ${r.type} (${r.skills})`).join('<br>')
    : 'No specific resources listed';
  
  // Build action buttons based on project status
  let actionButtons = '';
  
  if (project.status === 'active') {
    actionButtons = `
      <button id="completeProjectBtn" class="swal2-confirm swal2-styled" style="background-color: #28a745;">
        <i class="fas fa-check-circle"></i> Complete Project
      </button>
    `;
  }
  
  Swal.fire({ 
    icon: 'info', 
    title: project.project_name,
    html: `
      <div style="text-align: left;">
        <p><strong>Status:</strong> ${project.status}</p>
        <p><strong>Start Date:</strong> ${fmtDate(project.start_date)}</p>
        <p><strong>Duration:</strong> ${project.duration || '—'}</p>
        <p><strong>Priority:</strong> ${project.priority || '—'}</p>
        <p><strong>Resources Needed:</strong> ${project.total_resources_needed}</p>
        <p><strong>Resources Assigned:</strong> ${project.assigned_resources}</p>
        <br>
        <p><strong>Requested Resources:</strong></p>
        <p>${resourcesList}</p>
        ${project.notes ? `<br><p><strong>Notes:</strong><br>${escapeHtml(project.notes)}</p>` : ''}
      </div>
    `,
    width: 600,
    showConfirmButton: project.status !== 'active',
    showCancelButton: false,
    confirmButtonText: 'OK',
    footer: actionButtons,
    didOpen: () => {
      const completeBtn = document.getElementById('completeProjectBtn');
      if (completeBtn) {
        completeBtn.onclick = () => {
          Swal.close();
          completeProject(id);
        };
      }
    }
  }); 
}

function handleLogout() {
  Swal.fire({
    title: 'Logout', 
    text: 'Are you sure you want to logout?', 
    icon: 'question',
    showCancelButton: true, 
    confirmButtonColor: '#1a1a1a', 
    cancelButtonColor: '#d9534f', 
    confirmButtonText: 'Yes, logout'
  }).then(r => { 
    if (r.isConfirmed) {
      window.location.href = '../../controllers/AuthController.php?action=logout'; 
    }
  });
}

/* ---------- Initialize modal listeners ---------- */
function initializeModalListeners() {
  const newProjectModal = document.getElementById('newProjectModal');
  const requestModal = document.getElementById('requestModal');
  
  if (newProjectModal) {
    newProjectModal.addEventListener('click', e => { 
      if (e.target.id === 'newProjectModal') closeNewProjectModal(); 
    });
  }
  
  if (requestModal) {
    requestModal.addEventListener('click', e => { 
      if (e.target.id === 'requestModal') closeRequestModal(); 
    });
  }
}

/* ---------- boot ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async function() {
    initializeModalListeners();
    await loadUserInfo();
    await loadProjects();
  });
} else {
  (async function() {
    initializeModalListeners();
    await loadUserInfo();
    await loadProjects();
  })();
}