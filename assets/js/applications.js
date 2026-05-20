// === applications.js ===
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('application-form');
    if (!form) return;
    form.addEventListener('submit', handleApplicationSubmit);
});

async function handleApplicationSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-application');
    const messageDiv = document.getElementById('application-message');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    messageDiv.innerHTML = '';
    const jobId = document.getElementById('job-id-input').value;
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const cvFile = document.getElementById('cv-upload').files[0];
    const coverLetter = document.getElementById('cover-letter').value.trim();
    if (!jobId || !fullName || !email || !phone || !cvFile) {
        showMessage('application-message', 'Please fill all required fields and upload your CV.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        return;
    }
    if (cvFile.size > 5 * 1024 * 1024) {
        showMessage('application-message', 'CV file must be under 5MB.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        return;
    }
    try {
        const storageRef = storage.ref(`cvs/${Date.now()}_${cvFile.name}`);
        const uploadSnapshot = await storageRef.put(cvFile);
        const cvUrl = await uploadSnapshot.ref.getDownloadURL();
        await db.collection('applications').add({
            jobId,
            fullName,
            email,
            phone,
            cvUrl,
            cvFileName: cvFile.name,
            coverLetter,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'new'
        });
        showMessage('application-message', '✅ Application submitted successfully! We will contact you soon.', 'success');
        form.reset();
        document.getElementById('display-job-title').textContent = 'Application submitted!';
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('application-message', '❌ Error submitting application. Please try again.', 'error');
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
}
