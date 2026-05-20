
function initTypingAnimation() {
    const phrases = [
        'International Opportunities',
        'Top Companies Worldwide',
        'Your Dream Career',
        'Global Talent Network',
        'Executive Positions',
        'Remote Work Options'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;
    
    function type() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentPhrase.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }
        
        setTimeout(type, typeSpeed);
    }
    
    type();
}

function initParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(200, 168, 78, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 10 + 5}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% { transform: translate(0, 0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translate(${Math.random() * 100 - 50}px, -${Math.random() * 200 + 100}px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function initScrollTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    const dotsContainer = document.getElementById('testimonial-dots');
    const prevBtn = document.getElementById('prev-testimonial');
    const nextBtn = document.getElementById('next-testimonial');
    
    if (!track || !dotsContainer) return;
    
    const cards = track.children;
    let currentIndex = 0;
    
    // Create dots
    for (let i = 0; i < cards.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('testimonial-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    
    function goToSlide(index) {
        currentIndex = index;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        document.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    prevBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        goToSlide(currentIndex);
    });
    
    nextBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % cards.length;
        goToSlide(currentIndex);
    });
    
    // Auto-play
    setInterval(() => {
        currentIndex = (currentIndex + 1) % cards.length;
        goToSlide(currentIndex);
    }, 5000);
}

function initFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    const searchInput = document.getElementById('featured-job-search');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            const filter = tag.dataset.filter;
            filterFeaturedJobs(filter, searchInput?.value || '');
        });
    });
    
    searchInput?.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'all';
        filterFeaturedJobs(activeFilter, searchInput.value);
    });
}

function filterFeaturedJobs(category, search) {
    const grid = document.getElementById('featured-jobs-grid');
    if (!grid) return;
    
    const cards = grid.querySelectorAll('.job-card');
    cards.forEach(card => {
        const cardCategory = card.dataset.category;
        const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const matchesCategory = category === 'all' || cardCategory === category;
        const matchesSearch = !search || cardTitle.includes(search.toLowerCase());
        
        if (matchesCategory && matchesSearch) {
            card.style.display = '';
            card.style.animation = 'fadeInUp 0.5s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

// Add fadeInUp animation if not already in stylesheet
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(animationStyle);
