// ===== LOADER =====
window.addEventListener('load', () => {
  const fill = document.querySelector('.loader-fill');
  let w = 0;
  const iv = setInterval(() => {
    w += Math.random() * 15 + 5;
    if (w >= 100) { w = 100; clearInterval(iv); }
    fill.style.width = w + '%';
    if (w === 100) {
      setTimeout(() => {
        document.getElementById('loader').classList.add('done');
        startAnimations();
      }, 400);
    }
  }, 60);
});

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
function animCursor() {
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  follower.style.left = fx + 'px'; follower.style.top = fy + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();
document.querySelectorAll('a, button, .city-card, .chip').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.classList.add('hovering'); follower.classList.add('hovering'); });
  el.addEventListener('mouseleave', () => { cursor.classList.remove('hovering'); follower.classList.remove('hovering'); });
});

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => { navLinks.classList.toggle('open'); navToggle.classList.toggle('active'); });
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => { navLinks.classList.remove('open'); navToggle.classList.remove('active'); }));

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.target;
    let cur = 0;
    const step = target / 60;
    const iv = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(iv); }
      el.textContent = Math.floor(cur);
    }, 16);
  });
}

// ===== INTERSECTION OBSERVER =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      if (e.target.classList.contains('hero-stats')) animateCounters();
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.animate-in, .hero-stats').forEach(el => observer.observe(el));

// ===== START ANIMATIONS =====
function startAnimations() {
  document.querySelectorAll('.animate-in').forEach(el => {
    const delay = el.style.getPropertyValue('--delay') || '0s';
    setTimeout(() => el.classList.add('visible'), parseFloat(delay) * 1000);
  });
}

// ===== RENDER CITIES =====
function renderCities(filter = 'all', query = '') {
  const grid = document.getElementById('citiesGrid');
  grid.innerHTML = '';
  const filtered = CITIES.filter(c => {
    const matchFilter = filter === 'all' || c.category.includes(filter);
    const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.subtitle.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results">No cities found. Try a different search.</div>';
    return;
  }
  filtered.forEach((city, i) => {
    const card = document.createElement('div');
    card.className = 'city-card';
    card.style.setProperty('--card-color', city.color);
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="card-top" style="background:${city.gradient}">
        <div class="card-emoji">${city.emoji}</div>
        <div class="card-region">${city.region}</div>
        <div class="card-overlay"></div>
      </div>
      <div class="card-body">
        <div class="card-cats">
          ${city.category.map(c => `<span class="cat-tag">${c}</span>`).join('')}
        </div>
        <h3 class="card-name">${city.name}</h3>
        <p class="card-subtitle">${city.subtitle}</p>
        <p class="card-desc">${city.description.slice(0, 110)}…</p>
        <div class="card-famous">
          ${city.famous.slice(0,3).map(f => `<span class="famous-tag">📍 ${f}</span>`).join('')}
        </div>
        <button class="card-btn" data-id="${city.id}">Explore City →</button>
      </div>
    `;
    card.querySelector('.card-btn').addEventListener('click', () => openModal(city.id));
    grid.appendChild(card);

    // Animate in
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('card-visible')));
  });
}

// ===== FILTER & SEARCH =====
let currentFilter = 'all';
let currentQuery = '';
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderCities(currentFilter, currentQuery);
  });
});
document.getElementById('searchInput').addEventListener('input', e => {
  currentQuery = e.target.value;
  renderCities(currentFilter, currentQuery);
});

// ===== MAP =====
const map = L.map('map', { zoomControl: false }).setView([19.5, 76.5], 7);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19
}).addTo(map);

// Custom marker
function createIcon(emoji, color) {
  return L.divIcon({
    className: '',
    html: `<div class="map-marker" style="background:${color}"><span>${emoji}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44]
  });
}

CITIES.forEach(city => {
  const marker = L.marker([city.lat, city.lng], { icon: createIcon(city.emoji, city.color) }).addTo(map);
  marker.on('click', () => showMapSidebar(city));
  marker.bindTooltip(city.name, { className: 'map-tooltip', direction: 'top', offset: [0, -48] });
});

function showMapSidebar(city) {
  const sidebar = document.getElementById('mapSidebar');
  sidebar.innerHTML = `
    <div class="map-city-info">
      <div class="map-city-header" style="background:${city.gradient}">
        <div class="map-city-emoji">${city.emoji}</div>
        <div>
          <h3>${city.name}</h3>
          <p>${city.subtitle}</p>
        </div>
      </div>
      <div class="map-city-body">
        <p class="map-city-tagline">"${city.tagline}"</p>
        <div class="map-info-row"><strong>Region:</strong> ${city.region}</div>
        <div class="map-info-row"><strong>Best Time:</strong> ${city.bestTime}</div>
        <div class="map-section-label">🏛️ Must Visit</div>
        <ul class="map-list">
          ${city.mustSee.slice(0,3).map(m => `<li><strong>${m.name}</strong> — ${m.desc.slice(0,60)}…</li>`).join('')}
        </ul>
        <div class="map-section-label">🍽️ Famous Food</div>
        <div class="map-tags">
          ${city.food.slice(0,4).map(f => `<span class="map-tag">${f}</span>`).join('')}
        </div>
        <button class="map-explore-btn" onclick="openModal('${city.id}')">Full City Guide →</button>
      </div>
    </div>
  `;
  sidebar.classList.add('active');
  map.setView([city.lat, city.lng], 10, { animate: true });
}

// ===== HERITAGE =====
function renderHeritage() {
  const grid = document.getElementById('heritageGrid');
  HERITAGE_SITES.forEach((site, i) => {
    const card = document.createElement('div');
    card.className = 'heritage-card';
    card.style.setProperty('--hcolor', site.color);
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <div class="heritage-icon" style="background:${site.color}">${site.emoji}</div>
      <div class="heritage-info">
        <div class="heritage-type">${site.type}</div>
        <h3>${site.name}</h3>
        <div class="heritage-meta">📍 ${site.location} &nbsp;|&nbsp; 📅 ${site.year}</div>
        <p>${site.desc}</p>
      </div>
    `;
    grid.appendChild(card);
    observer.observe(card);
  });
}

// ===== FESTIVALS =====
function renderFestivals() {
  const track = document.getElementById('festivalsTrack');
  [...FESTIVALS, ...FESTIVALS].forEach(f => {
    const card = document.createElement('div');
    card.className = 'festival-card';
    card.innerHTML = `
      <div class="festival-emoji">${f.emoji}</div>
      <h4>${f.name}</h4>
      <p>${f.desc}</p>
      <span class="festival-season">${f.season}</span>
    `;
    track.appendChild(card);
  });
}

// ===== CUISINE =====
function renderCuisine() {
  const grid = document.getElementById('cuisineGrid');
  CUISINES.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'cuisine-card';
    card.style.setProperty('--ccolor', item.color);
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="cuisine-emoji" style="background:${item.color}">${item.emoji}</div>
      <div class="cuisine-info">
        <span class="cuisine-city">${item.city}</span>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
      </div>
    `;
    grid.appendChild(card);
    observer.observe(card);
  });
}

// ===== MODAL =====
function openModal(id) {
  const city = CITIES.find(c => c.id === id);
  if (!city) return;
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-hero" style="background:${city.gradient}">
      <div class="modal-emoji">${city.emoji}</div>
      <div class="modal-hero-text">
        <h2>${city.name}</h2>
        <p>${city.subtitle}</p>
        <div class="modal-region">📍 ${city.region}, Maharashtra</div>
      </div>
    </div>
    <div class="modal-body">
      <blockquote class="modal-tagline">"${city.tagline}"</blockquote>
      
      <section class="modal-section">
        <h3>About ${city.name}</h3>
        <p>${city.description}</p>
      </section>

      <section class="modal-section">
        <h3>🏛️ History</h3>
        <p>${city.history}</p>
      </section>
      
      <section class="modal-section">
        <h3>📍 Must-See Places</h3>
        <div class="modal-places">
          ${city.mustSee.map(p => `
            <div class="modal-place">
              <h4>${p.name}</h4>
              <p>${p.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="modal-section">
        <h3>🍽️ Famous Foods</h3>
        <div class="modal-tags">
          ${city.food.map(f => `<span class="modal-tag" style="border-color:${city.color}">${f}</span>`).join('')}
        </div>
      </section>

      <section class="modal-section">
        <h3>🎉 Festivals</h3>
        <div class="modal-tags">
          ${city.festivals.map(f => `<span class="modal-tag" style="border-color:${city.color}">${f}</span>`).join('')}
        </div>
      </section>
      
      <div class="modal-meta-row">
        <div class="modal-meta-box">
          <span class="meta-label">🌤 Best Time to Visit</span>
          <span class="meta-value">${city.bestTime}</span>
        </div>
      </div>

      <div class="modal-funfact">
        <div class="funfact-label">💡 Did You Know?</div>
        <p>${city.funFact}</p>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const el = document.querySelector(a.getAttribute('href'));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== PARALLAX =====
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroBg = document.querySelector('.hero-pattern');
  if (heroBg) heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
});

// ===== INIT =====
renderCities();
renderHeritage();
renderFestivals();
renderCuisine();

// Observe section headers
document.querySelectorAll('.section-header, .about-text, .about-image-grid').forEach(el => observer.observe(el));
