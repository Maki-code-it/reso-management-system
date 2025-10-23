/* ---------- HARD NAV: ensure sidebar links navigate ---------- */
document.addEventListener('click', function (e) {
  const a = e.target.closest('a.menu-item');
  if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  window.location.href = a.getAttribute('href');
}, true);

/* ---------- Overlay clicks close ---------- */
['personalModal','professionalModal','skillsModal'].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener('click', (e)=>{ if(e.target===el){ el.classList.remove('active'); }});
});

/* ---------- Profile Data ---------- */
let profile = { details: {}, skills: [] };

/* ---------- Fetch profile from server ---------- */
async function loadProfile() {
  try {
      const res = await fetch('./assets/php/profile.php?action=load', {
          credentials: 'same-origin'
      });

      if (res.status === 401) {
          Swal.fire({
              icon: 'error',
              title: 'Unauthorized',
              text: 'You must log in first.',
              confirmButtonColor: '#1a1a1a'
          }).then(() => window.location.href = '../login.php');
          return;
      }

      const data = await res.json();
      profile = data.details ? data : { details: {}, skills: [] };
      render();
  } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load profile.' });
  }
}


/* ---------- Render helpers ---------- */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
}

function renderSkills() {
  const wrap = document.getElementById('skillsList');
  wrap.innerHTML = profile.skills.length
      ? profile.skills.map(s=>`<span class="skill-pill">${escapeHtml(s.skill)}</span>`).join('')
      : '<span class="skill-pill">No skills yet</span>';

  const mwrap = document.getElementById('skillsModalList');
  mwrap.innerHTML = profile.skills.length
      ? profile.skills.map(s=>`
          <span class="skill-chip" data-id="${s.id}">
              ${escapeHtml(s.skill)}
              <button title="Remove" onclick="removeSkill(${s.id})">&times;</button>
          </span>
        `).join('')
      : '<span style="color:var(--text-gray);">No skills yet. Add one above.</span>';
}



function render() {
  const d = profile.details || {};
  document.getElementById('sidebarUser').textContent = d.name || 'John Doe';
  document.getElementById('displayName').textContent = d.name || '';
  document.getElementById('displayPosition').textContent = d.job_title || '';

  const avatarBox = document.getElementById('avatarBox');
  avatarBox.innerHTML = d.profile_pic
      ? `<img src="${d.profile_pic}" alt="Profile">`
      : `<i class="fas fa-user"></i>`;

  document.getElementById('infoName').textContent = d.name || '';
  document.getElementById('infoPosition').textContent = d.job_title || '';
  document.getElementById('infoAvailability').textContent = d.status || 'Available';
  document.getElementById('infoEmail').textContent = d.email || '';
  document.getElementById('infoLocation').textContent = d.location || '—';
  document.getElementById('infoEmployeeId').textContent = d.employee_id || '—';
  document.getElementById('infoPhone').textContent = d.phone_number || '—';
  document.getElementById('infoDepartment').textContent = d.department || '—';
  document.getElementById('infoJoinDate').textContent = d.join_date || '—';

  renderSkills();
}

/* ---------- Personal modal ---------- */
function openPersonalModal() {
  const f=document.getElementById('personalForm');
  const d = profile.details || {};
  f.name.value = d.name || '';
  f.position.value = d.job_title || '';
  f.availability.value = d.status || 'Available';
  document.getElementById('personalModal').classList.add('active');
}
function closePersonalModal() { document.getElementById('personalModal').classList.remove('active'); }
async function savePersonal() {
  const f=document.getElementById('personalForm');
  if(!f.reportValidity()) return;

  const payload = { job_title: f.position.value.trim(), status: f.availability.value };
  try {
      await fetch('./assets/php/profile.php?action=save_personal', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          credentials: 'same-origin',
          body:JSON.stringify(payload)
      });
      await loadProfile();
      closePersonalModal();
      Swal.fire({icon:'success',title:'Saved',text:'Personal information updated.',confirmButtonColor:'#1a1a1a'});
  } catch(err){ console.error(err); }
}

/* ---------- Professional modal ---------- */
function openProfessionalModal() {
  const f=document.getElementById('professionalForm');
  const d = profile.details || {};
  f.email.value = d.email || '';
  f.location.value = d.location || '';
  f.employee_id.value = d.employee_id || '';
  f.phone.value = d.phone_number || '';
  f.department.value = d.department || '';
  f.join_date.value = d.join_date || '';
  document.getElementById('professionalModal').classList.add('active');
}
function closeProfessionalModal(){ document.getElementById('professionalModal').classList.remove('active'); }
async function saveProfessional() {
  const f=document.getElementById('professionalForm');
  if(!f.reportValidity()) return;

  const payload = {
      email: f.email.value.trim(),
      department: f.department.value.trim(),
      phone_number: f.phone.value.trim(),
      location: f.location.value.trim(),
      join_date: f.join_date.value
  };
  try {
      await fetch('./assets/php/profile.php?action=save_professional', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          credentials: 'same-origin',
          body:JSON.stringify(payload)
      });
      await loadProfile();
      closeProfessionalModal();
      Swal.fire({icon:'success',title:'Saved',text:'Professional information updated.',confirmButtonColor:'#1a1a1a'});
  } catch(err){ console.error(err); }
}

/* ---------- Skills modal ---------- */
function openSkillsModal() { 
  document.getElementById('skillInput').value='';
  renderSkills(); 
  document.getElementById('skillsModal').classList.add('active'); 
  setTimeout(()=>document.getElementById('skillInput').focus(),50);
}
function closeSkillsModal(){ document.getElementById('skillsModal').classList.remove('active'); }

async function addSkill() {
  const inp = document.getElementById('skillInput');
  const val = (inp.value || '').trim();
  if (!val) return;

  // 🩹 Safely handle duplicates even if skills aren't strings
  const valLower = val.toLowerCase();
  if (profile.skills.some(s => String(s).toLowerCase() === valLower)) {
    Swal.fire({
      icon: 'info',
      title: 'Duplicate',
      text: 'That skill already exists.',
      confirmButtonColor: '#1a1a1a'
    });
    return;
  }

  try {
    await fetch('./assets/php/profile.php?action=add_skill', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'same-origin',
      body: JSON.stringify({ skill: val }) 
    });

    inp.value = '';
    await loadProfile();
  } catch (err) {
    console.error(err);
  }
}


async function removeSkill(skillId) {
  try {
      await fetch('./assets/php/profile.php?action=remove_skill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id: skillId })
      });
      await loadProfile();
  } catch (err) { console.error(err); }
}


/* ---------- Avatar upload ---------- */
document.getElementById('profilePictureInput').addEventListener('change', async e=>{
  const file = e.target.files?.[0];
  if(!file || !file.type.startsWith('image/')) return;

  const form = new FormData();
  form.append('avatar', file);

  try {
      await fetch('./assets/php/profile.php?action=upload_avatar', { 
          method:'POST', 
          credentials: 'same-origin',
          body:form 
      });
      await loadProfile();
      Swal.fire({icon:'success',title:'Uploaded',text:'Profile photo updated.',confirmButtonColor:'#1a1a1a'});
  } catch(err){ console.error(err); }
});

/* ---------- Logout ---------- */
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



/* ---------- Overlay styling ---------- */
(function ensureOverlayClickThrough(){
  const style=document.createElement('style');
  style.textContent = `
      .modal-overlay { display:none; pointer-events:none; }
      .modal-overlay.active { display:flex; pointer-events:auto; }
  `;
  document.head.appendChild(style);
})();

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addSkillBtn");
  if (addBtn) {
      addBtn.addEventListener("click", (e) => {
          e.preventDefault(); // prevent form submission if inside a form
          addSkill();
      });
  }
});


/* ---------- Init ---------- */
loadProfile();
