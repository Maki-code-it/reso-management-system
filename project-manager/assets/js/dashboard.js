 // Always allow sidebar links to navigate (even if another script prevents default)
 document.addEventListener('click', function (e) {
    const a = e.target.closest('.sidebar .menu-item');
    if (!a) return;
    // close any open overlay on navigation
    const overlay = document.getElementById('newProjectModal');
    if (overlay) overlay.classList.remove('active');
    e.stopImmediatePropagation?.();
    window.location.href = a.href;
    e.preventDefault();
  }, true);

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

  async function loadPendingProjects() {
    const tbody = document.getElementById('pendingProjectsBody');
    tbody.innerHTML = '';

    // Show loading using Swal
    Swal.fire({
        title: 'Loading projects...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const res = await fetch('assets/php/get-projects.php'); 
        const projects = await res.json();

        tbody.innerHTML = '';

        if (!projects.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'No pending projects';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            projects.forEach(project => {
                const row = document.createElement('tr');

                // Project Name
                const nameCell = document.createElement('td');
                const nameStrong = document.createElement('strong');
                nameStrong.textContent = project.project_name;
                nameCell.appendChild(nameStrong);
                row.appendChild(nameCell);

                // Resources Needed
                const resourcesCell = document.createElement('td');
                resourcesCell.textContent = project.total_resources_needed || 0;
                row.appendChild(resourcesCell);

                // Start Date
                const startCell = document.createElement('td');
                startCell.textContent = project.start_date || '—';
                row.appendChild(startCell);

                // Priority
                const priorityCell = document.createElement('td');
                const priorityBadge = document.createElement('span');
                priorityBadge.className = 'badge badge-secondary';
                priorityBadge.textContent = project.priority || '—';
                priorityCell.appendChild(priorityBadge);
                row.appendChild(priorityCell);

                // Status
                const statusCell = document.createElement('td');
                const statusBadge = document.createElement('span');
                let statusClass = 'badge-secondary';
                switch (project.status) {
                    case 'pending': statusClass = 'badge-warning'; break;
                    case 'active': statusClass = 'badge-info'; break;
                    case 'completed': statusClass = 'badge-success'; break;
                    case 'cancelled': statusClass = 'badge-danger'; break;
                }
                statusBadge.className = `badge ${statusClass}`;
                statusBadge.textContent = project.status;
                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);

                // Action button
                const actionCell = document.createElement('td');
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-secondary';
                btn.innerHTML = '<i class="fas fa-eye"></i> View';
                actionCell.appendChild(btn);
                row.appendChild(actionCell);

                tbody.appendChild(row);
            });
        }
    } catch (err) {
        tbody.innerHTML = '';
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'Error loading projects';
        row.appendChild(cell);
        tbody.appendChild(row);
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load projects.' });
    } finally {
        Swal.close(); // always close the loading
    }
}

async function loadDashboardStats() {
  try {
      const res = await fetch('./assets/php/dashboard-stats.php', { credentials: 'same-origin' });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to load stats');

      document.querySelectorAll('.stat-card').forEach(card => {
          const h3 = card.querySelector('h3').textContent.toLowerCase();
          if (h3.includes('active')) card.querySelector('.stat-value').textContent = data.data.active;
          if (h3.includes('pending')) card.querySelector('.stat-value').textContent = data.data.pending;
          if (h3.includes('completed')) card.querySelector('.stat-value').textContent = data.data.completed;
          if (h3.includes('total resources')) card.querySelector('.stat-value').textContent = data.data.resources;
      });

  } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load dashboard stats' });
  }
}

// Call after DOM loaded
document.addEventListener('DOMContentLoaded', loadDashboardStats);


function renderProfile() {
  const d = profile.details || {};
  const el = document.getElementById('sidebarUser');
  if (el) el.textContent = d.name || 'John Doe';
}


let profile = { details: {} };

async function loadProfile() {
  // Show loading using Swal
  Swal.fire({
    title: 'Loading profile...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch('./assets/php/profile.php?action=load', {
      credentials: 'same-origin'
    });

    if (res.status === 401) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'You must log in first.',
        confirmButtonColor: '#1a1a1a'
      }).then(() => window.location.href = '../LOGIN/HTML_Files/login.html');
      return;
    }

    const data = await res.json();
    profile = data.details ? data : { details: {} };
    renderProfile();
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load profile.'
    });
  } finally {
    Swal.close();
  }
}
window.addEventListener('DOMContentLoaded', () => {
    loadProfile();          
    loadPendingProjects(); 
  });
  
