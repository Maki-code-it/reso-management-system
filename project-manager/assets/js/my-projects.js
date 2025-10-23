 /* ---------- force hard navigation for sidebar ---------- */
 document.addEventListener('click', function (e) {
    const a = e.target.closest('a[data-force-nav]');
    if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.location.href = a.href;
  }, true);

  /* ---------- localStorage “DB” ---------- */
  const PKEY = 'rms_projects';

  function nowISO(){ return new Date().toISOString().slice(0,10); } // yyyy-mm-dd
  function loadProjects(){
    try {
      const raw = JSON.parse(localStorage.getItem(PKEY) || '[]');
      if (Array.isArray(raw) && raw.length) return raw;
    } catch {}
    // seed with a sample
    const demo = [{
      id: 1001,
      project_name: "Website Revamp",
      status: "active",
      start_date: nowISO(),
      duration: "3 months",
      priority: "High",
      total_resources_needed: 6,
      assigned_resources: 3,
      created_at: nowISO(),
      completed_at: null,
      notes: "Migrate marketing site to new design system.",
      resources: [{type:"Developer", count:3, skills:"React, Node"}],
      history: [
        { ts: nowISO(), event: "Project created" },
        { ts: nowISO(), event: "Project started" },
        { ts: nowISO(), event: "Allocated 3 of 6" }
      ]
    }];
    localStorage.setItem(PKEY, JSON.stringify(demo));
    return demo;
  }
  function saveProjects(list){ localStorage.setItem(PKEY, JSON.stringify(list)); }

  let allProjects = loadProjects();

  /* ---------- helpers ---------- */
  function percentage(p){ return p.total_resources_needed ? Math.round((p.assigned_resources / p.total_resources_needed) * 100) : 0; }
  function progressClass(pct){ return pct>=100?'full':(pct>=50?'partial':''); }
  function badgeByStatus(s){ if(s==='active')return['success','Active']; if(s==='pending')return['warning','Pending']; return['info','Completed']; }
  function fmtDate(s){ if(!s) return '—'; const d=new Date(s); return isNaN(d)?'—':d.toLocaleDateString(undefined,{month:'short',day:'2-digit',year:'numeric'}); }
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }

  /* ---------- render ---------- */
  function projectCard(p){
    const pct = percentage(p), pClass = progressClass(pct), [badgeClass,badgeText] = badgeByStatus(p.status);
    const dateLabel = p.status==='completed' ? 'Completed' : (p.status==='pending' ? 'Requested' : 'Start');
    const dateValue = p.status==='completed' ? fmtDate(p.completed_at) : (p.status==='pending' ? fmtDate(p.created_at) : fmtDate(p.start_date));

    const historyHtml = (p.history||[]).slice().reverse().map(h => `
      <li><i class="fas fa-circle" style="font-size:6px;"></i>
        <span>${escapeHtml(h.event)}</span>
        <time>— ${fmtDate(h.ts)}</time>
      </li>`).join('');

    return `
      <div class="project-card" data-id="${p.id}">
        <div class="project-header">
          <div>
            <h3 class="project-title">${escapeHtml(p.project_name || 'Untitled Project')}</h3>
            <span class="badge badge-${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-actions">
            ${p.status!=='pending' ? `
              <button class="btn btn-ghost btn-sm" onclick="openRequestModal(${p.id})">
                <i class="fas fa-user-plus"></i> Request Resources
              </button>` : ''}
            <button class="btn btn-sm btn-secondary" onclick="viewProject(${p.id})">
              <i class="fas fa-eye"></i> View
            </button>
          </div>
        </div>

        <div class="project-meta">
          <div class="project-meta-item"><i class="fas fa-calendar"></i><span>${dateLabel}: ${dateValue}</span></div>
          <div class="project-meta-item"><i class="fas fa-clock"></i><span>Duration: ${escapeHtml(p.duration||'—')}</span></div>
          <div class="project-meta-item"><i class="fas fa-flag"></i><span>Priority: ${escapeHtml(p.priority||'—')}</span></div>
        </div>

        ${p.status!=='pending' ? `
          <div class="resource-progress">
            <div class="progress-label">
              <span><strong>Resource Allocation:</strong></span>
              <span>${Number(p.assigned_resources)||0} / ${Number(p.total_resources_needed)||0} assigned (${pct}%)</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar ${pClass}" style="width:${Math.min(pct,100)}%"></div>
            </div>
          </div>` : `
          <div class="project-meta">
            <div class="project-meta-item">
              <i class="fas fa-users"></i><span>Resources Needed: ${Number(p.total_resources_needed)||0}</span>
            </div>
          </div>`}

        <div class="history">
          <h4><i class="fas fa-clock-rotate-left"></i> History</h4>
          <ul>${historyHtml || '<li><em>No history yet.</em></li>'}</ul>
        </div>
      </div>`;
  }

  function fillTab(id, items, emptyMsg){
    const el=document.getElementById(id);
    if(!items.length){
      el.innerHTML=`<div class="text-center" style="padding:40px;">
        <i class="fas fa-folder-open" style="font-size:48px;color:var(--medium-gray);margin-bottom:15px;"></i>
        <p style="color:var(--text-gray);">${emptyMsg}</p></div>`;
      return;
    }
    el.innerHTML = items.map(projectCard).join('');
  }

  function render(){
    const counts = {
      all: allProjects.length,
      active: allProjects.filter(p=>p.status==='active').length,
      pending: allProjects.filter(p=>p.status==='pending').length,
      completed: allProjects.filter(p=>p.status==='completed').length
    };
    document.getElementById('count-all').textContent=counts.all;
    document.getElementById('count-active').textContent=counts.active;
    document.getElementById('count-pending').textContent=counts.pending;
    document.getElementById('count-completed').textContent=counts.completed;

    fillTab('all-tab', allProjects, 'No projects yet. Click "New Project" to get started.');
    fillTab('active-tab', allProjects.filter(p=>p.status==='active'), 'No active projects.');
    fillTab('pending-tab', allProjects.filter(p=>p.status==='pending'), 'No pending projects.');
    fillTab('completed-tab', allProjects.filter(p=>p.status==='completed'), 'No completed projects yet.');
  }

  /* ---------- tabs ---------- */
  function switchTab(btn, tabName){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  /* ---------- NEW PROJECT MODAL (dynamic rows) ---------- */
  function openNewProjectModal(){ document.getElementById('newProjectModal').classList.add('active'); }
  function closeNewProjectModal(){
    document.getElementById('newProjectModal').classList.remove('active');
    const f = document.getElementById('newProjectForm'); f.reset();
    // keep just one resource row
    const container = document.getElementById('resourceContainer');
    [...container.querySelectorAll('.resource-row')].forEach((row, i)=>{ if(i>0) row.remove(); });
  }
  document.getElementById('newProjectModal').addEventListener('click', e => { if(e.target.id==='newProjectModal') closeNewProjectModal(); });

  function addResourceRow(){
    const c = document.getElementById('resourceContainer');
    const r = document.createElement('div');
    r.className='resource-row';
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
  function removeResourceRow(btn){
    const c = document.getElementById('resourceContainer');
    const rows = c.querySelectorAll('.resource-row');
    if(rows.length>1) btn.closest('.resource-row').remove();
    else Swal.fire({icon:'warning',title:'Cannot Remove',text:'At least one requirement row is needed.',confirmButtonColor:'#1a1a1a'});
  }

  function submitNewProject(e){
    e.preventDefault();
    const fd = new FormData(e.target);
    const types = fd.getAll('resource_type[]');
    const counts = fd.getAll('resource_count[]').map(n=>Number(n)||0);
    const skills = fd.getAll('required_skills[]');

    const resources = [];
    let totalNeeded = 0;
    for(let i=0;i<types.length;i++){
      resources.push({ type: types[i], count: counts[i], skills: skills[i] });
      totalNeeded += counts[i];
    }

    const proj = {
      id: Date.now(),
      project_name: fd.get('project_name'),
      status: "pending",
      start_date: fd.get('start_date'),
      duration: fd.get('duration'),
      priority: fd.get('priority'),
      total_resources_needed: totalNeeded,
      assigned_resources: 0,
      created_at: nowISO(),
      completed_at: null,
      notes: fd.get('notes')||'',
      resources,
      history: [{ ts: nowISO(), event: "Request submitted" }]
    };

    allProjects.push(proj);
    saveProjects(allProjects);
    closeNewProjectModal();
    render();
    Swal.fire({icon:'success',title:'Submitted',text:'New project request created (Pending).',confirmButtonColor:'#1a1a1a'});
  }

  /* ---------- REQUEST RESOURCES MODAL (dynamic rows) ---------- */
  let requestProjectId = null;

  function openRequestModal(projectId){
    const p = allProjects.find(x=>x.id===projectId);
    if(!p) return;
    requestProjectId = p.id;
    document.getElementById('reqProjectName').textContent = p.project_name;

    // reset form + keep one row
    const form = document.getElementById('requestForm');
    form.reset();
    const c = document.getElementById('reqResourceContainer');
    [...c.querySelectorAll('.resource-row')].forEach((row,i)=>{ if(i>0) row.remove(); });

    document.getElementById('requestModal').classList.add('active');
  }
  function closeRequestModal(){
    document.getElementById('requestModal').classList.remove('active');
    requestProjectId = null;
  }
  document.getElementById('requestModal').addEventListener('click', e => { if(e.target.id==='requestModal') closeRequestModal(); });

  function addReqRow(){
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
  function removeReqRow(btn){
    const c = document.getElementById('reqResourceContainer');
    const rows = c.querySelectorAll('.resource-row');
    if(rows.length>1) btn.closest('.resource-row').remove();
    else Swal.fire({icon:'warning',title:'Cannot Remove',text:'At least one requirement row is needed.',confirmButtonColor:'#1a1a1a'});
  }

  function submitResourceRequest(e){
    e.preventDefault();
    const p = allProjects.find(x=>x.id===requestProjectId);
    if(!p) return;

    const fd = new FormData(e.target);
    const types = fd.getAll('req_resource_type[]');
    const counts = fd.getAll('req_resource_count[]').map(n=>Number(n)||0);
    const skills = fd.getAll('req_required_skills[]');
    const reason = (fd.get('reason')||'').trim();

    // build a compact summary like: "+2 Developer (React), +1 QA (Cypress)"
    const parts = [];
    for(let i=0;i<types.length;i++){
      parts.push(`+${counts[i]} ${types[i]} (skills: ${skills[i]})`);
    }
    const summary = parts.join('; ');

    p.history = p.history || [];
    p.history.push({
      ts: nowISO(),
      event: `Requested resources: ${summary}` + (reason ? ` — ${reason}` : '')
    });

    saveProjects(allProjects);
    render();
    closeRequestModal();
    Swal.fire({icon:'success',title:'Request Submitted',text:'Your resource request has been logged for HR review.',confirmButtonColor:'#1a1a1a'});
  }

  /* ---------- misc ---------- */
  function viewProject(id){ Swal.fire({icon:'info',title:'Demo only',text:`Open details for project #${id}.`}); }
  function handleLogout(){
    Swal.fire({
      title:'Logout',
      text:'Are you sure you want to logout?',
      icon:'question',
      showCancelButton:true,
      confirmButtonColor:'#1a1a1a',
      cancelButtonColor:'#d9534f',
      confirmButtonText:'Yes, logout'
  }).then(async (result) => {
      if(result.isConfirmed){
          try {
              const res = await fetch('../controllers/AuthController.php?action=logout', {
                  method: 'GET',
                  credentials: 'same-origin'
              });
              const data = await res.json();
              if(data.success){
                  Swal.fire({
                      icon: 'success',
                      title: 'Logged out',
                      text: 'You have successfully logged out.',
                      confirmButtonColor:'#1a1a1a'
                  }).then(() => {
                      window.location.href = '../LOGIN/HTML_Files/login.html'; // or login.html
                  });
              }
          } catch(err){
              console.error(err);
              Swal.fire({icon:'error', title:'Error', text:'Logout failed.'});
          }
      }
  });
  }

  /* ---------- boot ---------- */
  render();