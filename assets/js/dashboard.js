// === dashboard.js ===
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('dashboard.html')) return;
    initDashboardTabs();
    loadDashboardStats();
    loadJobsTable();
    loadApplicationsTable();
    document.getElementById('add-job-form')?.addEventListener('submit', handleAddJob);
});

function initDashboardTabs() {
    const tabLinks = document.querySelectorAll('[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove(
            'active'));
            document.getElementById(tabName)?.classList.add('active');
            document.querySelectorAll('[data-tab]').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (tabName === 'jobs-tab') loadJobsTable();
            if (tabName === 'applications-tab') loadApplicationsTable();
            if (tabName === 'overview') loadDashboardStats();
        });
    });
}

async function loadDashboardStats() {
    try {
        const jobsSnap = await db.collection('jobs').get();
        const appsSnap = await db.collection('applications').get();
        const usersSnap = await db.collection('users').get();
        document.getElementById('total-jobs').textContent = jobsSnap.size;
        document.getElementById('total-applications').textContent = appsSnap.size;
        document.getElementById('total-users').textContent = usersSnap.size;
    } catch (error) {
        console.error('Stats error:', error);
    }
}

async function loadJobsTable() {
    const tbody = document.querySelector('#jobs-table tbody');
    if (!tbody) return;
    try {
        const snapshot = await db.collection('jobs').orderBy('createdAt', 'desc').get();
        tbody.innerHTML = snapshot.docs.map(doc => {
            const job = doc.data();
            return `<tr>
            <td>${job.title}</td><td>${job.country}</td><td>${job.category}</td><td>${job.type}</td>
            <td>
            <button class="btn btn-sm btn-primary" onclick="editJob('${doc.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteJob('${doc.id}')">Delete</button>
            </td></tr>`;
        }).join('');
    } catch (error) { tbody.innerHTML =
            '<tr><td colspan="5">Error loading jobs</td></tr>'; }
}

async function loadApplicationsTable() {
    const tbody = document.querySelector('#applications-table tbody');
    if (!tbody) return;
    try {
        const snapshot = await db.collection('applications').orderBy('createdAt', 'desc').get();
        tbody.innerHTML = snapshot.docs.map(doc => {
            const app = doc.data();
            const date = app.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A';
            return `<tr>
            <td>${app.fullName}</td><td>${app.email}</td><td>${app.jobId?.substring(0,8) || 'N/A'}</td>
            <td><a href="${app.cvUrl}" target="_blank" class="btn btn-sm btn-primary">Download CV</a></td>
            <td>${date}</td></tr>`;
        }).join('');
    } catch (error) { tbody.innerHTML =
            '<tr><td colspan="5">Error loading applications</td></tr>'; }
}

async function handleAddJob(e) {
    e.preventDefault();
    const title = document.getElementById('job-title').value.trim();
    const country = document.getElementById('job-country').value;
    const category = document.getElementById('job-category').value;
    const type = document.getElementById('job-type').value;
    const salary = document.getElementById('job-salary').value.trim();
    const description = document.getElementById('job-description').value.trim();
    const requirements = document.getElementById('job-requirements').value.trim();
    if (!title || !country || !category || !type || !description) {
        showMessage('add-job-message', 'Please fill all required fields.', 'error');
        return;
    }
    try {
        await db.collection('jobs').add({
            title,
            country,
            category,
            type,
            salary,
            description,
            requirements,
            featured: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showMessage('add-job-message', '✅ Job added successfully!', 'success');
        document.getElementById('add-job-form').reset();
        loadJobsTable();
        loadDashboardStats();
    } catch (error) {
        showMessage('add-job-message', '❌ Error adding job.', 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
        await db.collection('jobs').doc(jobId).delete();
        loadJobsTable();
        loadDashboardStats();
    } catch (error) { alert('Error deleting job.'); }
}

async function editJob(jobId) {
    try {
        const doc = await db.collection('jobs').doc(jobId).get();
        if (!doc.exists) return;
        const job = doc.data();
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-job-form');
        form.innerHTML = `
        <input type="hidden" id="edit-job-id" value="${jobId}">
        <div class="form-group"><label>Title</label><input type="text" id="edit-title" value="${job.title}" required></div>
        <div class="form-group"><label>Country</label><input type="text" id="edit-country" value="${job.country}" required></div>
        <div class="form-group"><label>Category</label><input type="text" id="edit-category" value="${job.category}" required></div>
        <div class="form-group"><label>Type</label><input type="text" id="edit-type" value="${job.type}" required></div>
        <div class="form-group"><label>Salary</label><input type="text" id="edit-salary" value="${job.salary || ''}"></div>
        <div class="form-group"><label>Description</label><textarea id="edit-description" required>${job.description || ''}</textarea></div>
        <button type="submit" class="btn btn-primary">Save Changes</button>`;
        modal.classList.add('active');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await db.collection('jobs').doc(jobId).update({
                title: document.getElementById('edit-title').value,
                country: document.getElementById('edit-country').value,
                category: document.getElementById('edit-category').value,
                type: document.getElementById('edit-type').value,
                salary: document.getElementById('edit-salary').value,
                description: document.getElementById('edit-description').value,
            });
            modal.classList.remove('active');
            loadJobsTable();
        };
    } catch (error) { alert('Error loading job for edit.'); }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close') || e.target.id === 'edit-modal') {
        document.getElementById('edit-modal')?.classList.remove('active');
    }
});
