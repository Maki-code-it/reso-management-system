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

    // Loading row
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 6;
    loadingCell.textContent = 'Loading...';
    loadingRow.appendChild(loadingCell);
    tbody.appendChild(loadingRow);

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
            return;
        }

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
            // Optional: add onclick to navigate to project details page
            // btn.onclick = () => { window.location.href = `project-details.html?id=${project.id}`; };
            actionCell.appendChild(btn);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

    } catch (err) {
        tbody.innerHTML = '';
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'Error loading projects';
        row.appendChild(cell);
        tbody.appendChild(row);
        console.error(err);
    }
}

let profile = { details: {} };

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
  }
}

function renderProfile() {
  const d = profile.details || {};
  document.getElementById('sidebarUser').textContent = d.name || 'John Doe';
}


window.addEventListener('DOMContentLoaded', () => {
    loadProfile();          
    loadPendingProjects(); 
  });
  
