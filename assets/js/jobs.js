
       
        const firebaseConfig = {
            apiKey: "AIzaSyDNqL34xZr2XcMWl_rLQ5SMsMBd5CaJJYc",
            authDomain: "studio-4335672844-604a7.firebaseapp.com",
            projectId: "studio-4335672844-604a7",
            storageBucket: "studio-4335672844-604a7.firebasestorage.app",
            messagingSenderId: "320647254259",
            appId: "1:320647254259:web:3015dd8629ffcb230be786"
        };

        // Initialize Firebase
        let db = null;
        let firebaseReady = false;

        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            db.settings({ merge: true });
            firebaseReady = true;
            console.log('✅ Firebase initialized successfully');
            console.log('📦 Connected to Firestore database');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error.message);
            console.error('Please check your Firebase configuration');
        }

        // State
        let allJobs = [];
        let currentPage = 1;
        const jobsPerPage = 12;

        // ==========================================
        // DOM READY
        // ==========================================
        document.addEventListener('DOMContentLoaded', () => {
            // Set current year
            document.getElementById('current-year').textContent = new Date().getFullYear();

            // Initialize AOS if available
            if (typeof AOS !== 'undefined') {
                AOS.init({ duration: 1000, once: true, offset: 100 });
            }

            // Check Firebase status
            if (!firebaseReady || !db) {
                document.getElementById('all-jobs-grid').innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1;">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <h3>Firebase Not Configured</h3>
                        <p style="max-width:500px;margin:0 auto;">Please update the <code>firebaseConfig</code> object in this file with your Firebase project credentials from the Firebase Console.</p>
                        <p style="font-size:0.85rem;margin-top:8px;color:var(--gray-600);">
                            1. Go to <a href="https://console.firebase.google.com" target="_blank" style="color:var(--gold-dark);">Firebase Console</a><br>
                            2. Open your project → Project Settings → General<br>
                            3. Copy the config from "Your apps" → Web app<br>
                            4. Paste it into the firebaseConfig object above
                        </p>
                    </div>`;
                return;
            }

            // Load jobs
            loadJobs();

            // Setup filters
            document.getElementById('search-jobs')?.addEventListener('input', debounce(() => { currentPage = 1;
                applyFilters(); }, 300));
            document.getElementById('filter-country')?.addEventListener('change', () => { currentPage = 1;
                applyFilters(); });
            document.getElementById('filter-category')?.addEventListener('change', () => { currentPage = 1;
                applyFilters(); });
            document.getElementById('filter-type')?.addEventListener('change', () => { currentPage = 1;
                applyFilters(); });

            // Populate countries
            populateCountries();
        });

        // ==========================================
        // LOAD JOBS FROM FIRESTORE
        // ==========================================
        async function loadJobs() {
            const grid = document.getElementById('all-jobs-grid');
            
            try {
                console.log('🔄 Fetching jobs from Firestore...');
                
                // Set a timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timed out - check your Firestore rules')), 10000)
                );

                const queryPromise = db.collection('jobs').orderBy('createdAt', 'desc').get();
                const snapshot = await Promise.race([queryPromise, timeoutPromise]);

                if (snapshot.empty) {
                    console.log('📭 No jobs found in Firestore');
                    grid.innerHTML = `
                        <div class="empty-state" style="grid-column:1/-1;">
                            <i class="bi bi-inbox"></i>
                            <h3>No Jobs Posted Yet</h3>
                            <p>Check back soon for new opportunities!</p>
                            <p style="font-size:0.85rem;color:var(--gray-600);margin-top:8px;">
                                Add jobs through the <a href="dashboard.html" style="color:var(--gold-dark);">Admin Dashboard</a>
                            </p>
                        </div>`;
                    return;
                }

                allJobs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log(`✅ Loaded ${allJobs.length} jobs from Firestore`);
                applyFilters();
            } catch (error) {
                console.error('❌ Error loading jobs:', error.message);
                
                let errorMessage = 'Error loading jobs. Please try again.';
                if (error.message.includes('timed out')) {
                    errorMessage = 'Connection timed out. Check your internet and Firestore rules.';
                } else if (error.message.includes('permission')) {
                    errorMessage = 'Permission denied. Check your Firestore security rules.';
                }

                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1;">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <h3>Error Loading Jobs</h3>
                        <p>${errorMessage}</p>
                        <p style="font-size:0.8rem;color:var(--gray-600);margin-top:4px;">${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top:16px;">
                            <i class="bi bi-arrow-clockwise"></i> Retry
                        </button>
                    </div>`;
            }
        }

        // ==========================================
        // FILTER & DISPLAY
        // ==========================================
        function getFilteredJobs() {
            const searchTerm = (document.getElementById('search-jobs')?.value || '').toLowerCase().trim();
            const country = document.getElementById('filter-country')?.value || '';
            const category = document.getElementById('filter-category')?.value || '';
            const type = document.getElementById('filter-type')?.value || '';

            return allJobs.filter(job => {
                const matchesSearch = !searchTerm ||
                    (job.title?.toLowerCase().includes(searchTerm)) ||
                    (job.description?.toLowerCase().includes(searchTerm)) ||
                    (job.company?.toLowerCase().includes(searchTerm));
                const matchesCountry = !country || job.country === country;
                const matchesCategory = !category || job.category === category;
                const matchesType = !type || job.type === type;
                return matchesSearch && matchesCountry && matchesCategory && matchesType;
            });
        }

        function applyFilters() {
            const filtered = getFilteredJobs();
            const start = (currentPage - 1) * jobsPerPage;
            const paginated = filtered.slice(start, start + jobsPerPage);
            renderJobCards(paginated, filtered.length);
        }

        function renderJobCards(jobs, totalFiltered) {
            const grid = document.getElementById('all-jobs-grid');
            const emptyState = document.getElementById('empty-state');

            if (jobs.length === 0) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            grid.innerHTML = jobs.map(job => {
                const date = job.createdAt?.toDate?.() || new Date();
                const daysAgo = getDaysAgo(date);

                return `
                <div class="job-card" onclick="window.location.href='job-details.html?id=${job.id}'">
                    <div class="job-card-header">
                        <span class="job-card-type ${job.featured ? 'featured' : ''}">
                            <i class="bi bi-briefcase-fill"></i> ${job.type || 'Full-time'}
                        </span>
                        ${job.featured ? '<span style="color:var(--gold);font-size:0.8rem;"><i class="bi bi-star-fill"></i> Featured</span>' : ''}
                    </div>
                    <h3>${job.title || 'Untitled Position'}</h3>
                    <div class="job-card-meta">
                        <span><i class="bi bi-geo-alt-fill"></i> ${job.country || 'Various'}</span>
                        <span><i class="bi bi-folder-fill"></i> ${job.category || 'General'}</span>
                        <span><i class="bi bi-clock-fill"></i> ${job.type || 'Full-time'}</span>
                    </div>
                    <div class="job-card-footer">
                        <span class="job-card-salary"><i class="bi bi-cash"></i> ${job.salary || 'Competitive'}</span>
                        <span class="job-card-link">View Details <i class="bi bi-arrow-right"></i></span>
                    </div>
                </div>`;
            }).join('');

            // Update count
            const countEl = document.getElementById('results-count');
            if (countEl) countEl.textContent = totalFiltered;
        }

        function resetFilters() {
            document.getElementById('search-jobs').value = '';
            document.getElementById('filter-country').value = '';
            document.getElementById('filter-category').value = '';
            document.getElementById('filter-type').value = '';
            currentPage = 1;
            applyFilters();
        }

        // ==========================================
        // POPULATE COUNTRIES
        // ==========================================
        function populateCountries() {
            const select = document.getElementById('filter-country');
            if (!select) return;

            const countries = [
                'Canada', 'Poland', 'Italy', 'Portugal', 'Malta', 'Germany', 'France',
                'Switzerland', 'Luxembourg', 'Nigeria', 'Liberia', 'Ivory Coast',
                'Cameroon', 'Morocco', 'Sierra Leone', 'South Africa', 'Kenya',
                'Mauritius', 'Zimbabwe'
            ];
            const flags = {
                'Canada': '🇨🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
                'Malta': '🇲🇹', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Switzerland': '🇨🇭',
                'Luxembourg': '🇱🇺', 'Nigeria': '🇳🇬', 'Liberia': '🇱🇷', 'Ivory Coast': '🇨🇮',
                'Cameroon': '🇨🇲', 'Morocco': '🇲🇦', 'Sierra Leone': '🇸🇱', 'South Africa': '🇿🇦',
                'Kenya': '🇰🇪', 'Mauritius': '🇲🇺', 'Zimbabwe': '🇿🇼'
            };

            countries.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = `${flags[c]||''} ${c}`;
                select.appendChild(opt);
            });
        }

        // ==========================================
        // UTILITY FUNCTIONS
        // ==========================================
        function getDaysAgo(date) {
            const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            if (diff === 0) return 'Today';
            if (diff === 1) return 'Yesterday';
            if (diff < 7) return `${diff} days ago`;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        function debounce(fn, wait) {
            let t;
            return (...args) => { clearTimeout(t);
                t = setTimeout(() => fn(...args), wait); };
        }

        // Make resetFilters globally accessible
        window.resetFilters = resetFilters;
    
