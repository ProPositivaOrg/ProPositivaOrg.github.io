// script.js
const API_CONFIG = {
    weather: {
        url: 'https://api.open-meteo.com/v1/forecast',
        params: '&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature&daily=sunrise,sunset&timezone=auto',
        fallback: {
            current_weather: { temperature: 27, weathercode: 1 },
            hourly: { apparent_temperature: [27], relativehumidity_2m: [70] },
            daily: { 
                sunrise: [new Date(Date.now() + 21600000).toISOString()], // 6am
                sunset: [new Date(Date.now() + 64800000).toISOString()]    // 6pm
            }
        }
    },
    marine: {
        url: 'https://marine-api.open-meteo.com/v1/marine',
        params: '&hourly=wave_height,wave_period',
        fallback: {
            hourly: { wave_height: [1.2], wave_period: [8] }
        }
    }
};

const MAP_CONFIG = {
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    costaRicaCenter: [9.7489, -83.7534],
    zoom: 7,
    locations: [
        {
            name: "San José",
            position: [9.9281, -84.0907],
            impact: 15200,
            projects: 12,
            type: "completed"
        },
        {
            name: "Puntarenas",
            position: [9.9763, -84.8384],
            impact: 8700,
            projects: 8,
            type: "completed"
        },
        {
            name: "Limón",
            position: [10.0024, -83.0843],
            impact: 6800,
            projects: 5,
            type: "progress"
        },
        {
            name: "Guanacaste",
            position: [10.6269, -85.4395],
            impact: 10500,
            projects: 7,
            type: "completed"
        },
        {
            name: "Cartago",
            position: [9.8644, -83.9194],
            impact: 4200,
            projects: 3,
            type: "progress"
        }
    ]
};

const WEATHER_ICONS = {
    0: 'fas fa-sun', // Clear sky
    1: 'fas fa-cloud-sun', // Mainly clear
    2: 'fas fa-cloud', // Partly cloudy
    3: 'fas fa-cloud', // Overcast
    45: 'fas fa-smog', // Fog
    48: 'fas fa-smog', // Depositing rime fog
    51: 'fas fa-cloud-rain', // Drizzle (light)
    53: 'fas fa-cloud-rain', // Drizzle (moderate)
    55: 'fas fa-cloud-rain', // Drizzle (dense)
    56: 'fas fa-cloud-rain', // Freezing drizzle (light)
    57: 'fas fa-cloud-rain', // Freezing drizzle (dense)
    61: 'fas fa-cloud-showers-heavy', // Rain (slight)
    63: 'fas fa-cloud-showers-heavy', // Rain (moderate)
    65: 'fas fa-cloud-showers-heavy', // Rain (heavy)
    66: 'fas fa-icicles', // Freezing rain (light)
    67: 'fas fa-icicles', // Freezing rain (heavy)
    71: 'fas fa-snowflake', // Snow fall (slight)
    73: 'fas fa-snowflake', // Snow fall (moderate)
    75: 'fas fa-snowflake', // Snow fall (heavy)
    77: 'fas fa-snowflake', // Snow grains
    80: 'fas fa-cloud-showers-heavy', // Rain showers (slight)
    81: 'fas fa-cloud-showers-heavy', // Rain showers (moderate)
    82: 'fas fa-cloud-showers-heavy', // Rain showers (violent)
    85: 'fas fa-snowflake', // Snow showers (slight)
    86: 'fas fa-snowflake', // Snow showers (heavy)
    95: 'fas fa-bolt', // Thunderstorm (slight/moderate)
    96: 'fas fa-bolt', // Thunderstorm with hail (slight)
    99: 'fas fa-bolt' // Thunderstorm with hail (heavy)
};

document.addEventListener('DOMContentLoaded', function() {
    // Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Language Toggle Functionality
    function setLanguage(lang) {
        // Update all elements with data attributes
        document.querySelectorAll('[data-es], [data-en]').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute(`data-${lang}-placeholder`)) {
                    element.placeholder = element.getAttribute(`data-${lang}-placeholder`);
                }
            } else {
                const text = element.getAttribute(`data-${lang}`);
                if (text !== null) element.textContent = text;
            }
        });

        // Update active buttons
        document.querySelectorAll('.language-btn, .lang-footer-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Update html lang attribute
        document.documentElement.lang = lang;

        // Reload dynamic content
        loadWeather(lang);
        loadNews(lang);
        
        // Re-render map with new language
        if (document.getElementById('impact-map')) {
            document.getElementById('impact-map').innerHTML = '';
            initImpactMap(lang);
        }
    }

    // Initialize language buttons
    document.querySelectorAll('.language-btn, .lang-footer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setLanguage(this.getAttribute('data-lang'));
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '☰';
        });
    });

    // Counter Animation for Impact Section
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const speed = 200;
        
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/,/g, '');
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment).toLocaleString();
                setTimeout(animateCounters, 1);
            } else {
                counter.innerText = target.toLocaleString();
            }
        });
    }

 function initImpactMap(lang = 'es') {
    // Check if map container exists
    if (!document.getElementById('impact-map')) return;
    
    // Create map instance with minimalist style
    const map = L.map('impact-map', {
        zoomControl: false,
        attributionControl: false
    }).setView(MAP_CONFIG.costaRicaCenter, MAP_CONFIG.zoom);

    // Add minimalist base tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: MAP_CONFIG.attribution,
        maxZoom: 18,
    }).addTo(map);

    // Custom icon class using your logo
    const LogoPin = L.DivIcon.extend({
        options: {
            className: 'logo-pin',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        }
    });

    // Create a custom icon with your logo
    function createCustomIcon(type) {
        const color = type === "completed" ? "#2F4C39" : "#D34F48";
        return new LogoPin({
            html: `
                <div style="
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    border: 2px solid ${color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 5px;
                ">
                    <img src="Assets/Logos/Asopropositiva 2025 logotipo.png" 
                         style="width: 100%; height: auto; object-fit: contain;">
                </div>
            `
        });
    }

    // Add markers for each location
    MAP_CONFIG.locations.forEach(location => {
        const marker = L.marker(location.position, {
            icon: createCustomIcon(location.type)
        });
        
        marker.bindPopup(`
            <div class="map-popup" style="
                padding: 1rem;
                font-family: 'Montserrat', sans-serif;
                color: #333;
            ">
                <h4 style="
                    margin: 0 0 0.5rem 0;
                    color: ${location.type === "completed" ? "#2F4C39" : "#D34F48"};
                ">${location.name}</h4>
                <p style="margin: 0.3rem 0;"><strong>${lang === 'es' ? 'Personas beneficiadas' : 'People benefited'}:</strong> ${location.impact.toLocaleString()}</p>
                <p style="margin: 0.3rem 0;"><strong>${lang === 'es' ? 'Proyectos' : 'Projects'}:</strong> ${location.projects}</p>
                <p style="margin: 0.3rem 0;"><strong>${lang === 'es' ? 'Estado' : 'Status'}:</strong> 
                    <span style="color: ${location.type === "completed" ? "#2F4C39" : "#D34F48"}">
                        ${lang === 'es' ? 
                            (location.type === "completed" ? "Completado" : "En progreso") : 
                            (location.type === "completed" ? "Completed" : "In progress")}
                    </span>
                </p>
            </div>
        `);
        
        marker.addTo(map);
        
        // Add tooltip on hover
        marker.bindTooltip(location.name, {
            permanent: false,
            direction: 'top'
        });
    });
    
    // Add zoom controls with better position
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
}

    // ================== WEATHER FUNCTIONS ================== //
    async function loadWeather(lang = 'es') {
        // Safely get DOM elements
        const locationSelect = document.getElementById('location-select');
        const loadingElement = document.getElementById('weather-loading');
        const weatherCards = document.querySelectorAll('.weather-card');
        
        if (!locationSelect || !loadingElement || weatherCards.length === 0) return;

        // Show loading state
        try {
            loadingElement.style.display = 'flex';
            weatherCards.forEach(card => card.classList.add('loading'));
        } catch (domError) {
            console.warn('DOM loading state error:', domError);
        }

        try {
            // Parse coordinates with validation
            const [lat, lon] = locationSelect.value.split(',').map(Number);
            if (isNaN(lat) || isNaN(lon)) throw new Error('Invalid coordinates');

            // Fetch data with timeout and fallbacks
            const [weatherData, marineData] = await Promise.all([
                fetchWithFallback(() => fetchWeatherData(lat, lon), API_CONFIG.weather.fallback),
                fetchWithFallback(() => fetchMarineData(lat, lon), API_CONFIG.marine.fallback)
            ]);

            // Cache successful responses
            cacheWeatherData(weatherData, marineData);

            // Update UI
            updateWeatherUI(weatherData, marineData, lang);

        } catch (error) {
            console.error("Weather loading error:", error);
            showError(lang, error.message);
            
            // Try to show cached data
            const cached = getCachedWeather();
            if (cached) {
                updateWeatherUI(cached.weather, cached.marine, lang);
                showWarning(lang, lang === 'es' ? 'Mostrando datos en caché' : 'Showing cached data');
            }
        } finally {
            // Clean up loading state
            try {
                loadingElement.style.display = 'none';
                weatherCards.forEach(card => card.classList.remove('loading'));
            } catch (domError) {
                console.warn('DOM cleanup error:', domError);
            }
        }
    }

    async function fetchWithFallback(fetchFn, fallback, timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetchFn({ signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            console.warn(`Using fallback data: ${error.message}`);
            return fallback;
        }
    }

    async function fetchWeatherData(lat, lon, { signal } = {}) {
        const url = `${API_CONFIG.weather.url}?latitude=${lat}&longitude=${lon}${API_CONFIG.weather.params}`;
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`Weather API: ${response.status}`);
        return await response.json();
    }

    async function fetchMarineData(lat, lon, { signal } = {}) {
        const url = `${API_CONFIG.marine.url}?latitude=${lat}&longitude=${lon}${API_CONFIG.marine.params}`;
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`Marine API: ${response.status}`);
        return await response.json();
    }

    function cacheWeatherData(weather, marine) {
        try {
            localStorage.setItem('weatherCache', JSON.stringify({
                weather,
                marine,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Weather caching failed:', error);
        }
    }

    function getCachedWeather() {
        try {
            const cached = localStorage.getItem('weatherCache');
            if (!cached) return null;
            const data = JSON.parse(cached);
            // Only use cache if less than 1 hour old
            return (Date.now() - data.timestamp < 3600000) ? data : null;
        } catch {
            return null;
        }
    }

    function updateWeatherUI(weatherData, marineData, lang) {
        // Safe DOM updater with null checks
        const setContent = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        const setHTML = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        // Current weather
        setContent('current-temp', weatherData.current_weather?.temperature ?? '--');
        setContent('feels-like', `${weatherData.hourly?.apparent_temperature?.[0] ?? '--'}°C`);
        setContent('humidity', `${weatherData.hourly?.relativehumidity_2m?.[0] ?? '--'}%`);

        // Weather icon
        const weatherCode = weatherData.current_weather?.weathercode ?? 1;
        setHTML('current-icon', `<i class="${WEATHER_ICONS[weatherCode] || 'fas fa-question'}"></i>`);

        // Sun times
        const sunrise = new Date(weatherData.daily?.sunrise?.[0] || Date.now() + 21600000);
        const sunset = new Date(weatherData.daily?.sunset?.[0] || Date.now() + 64800000);
        
        // Sun/Moon section with icons
        const sunMoonContainer = document.querySelector('.sun-moon-container');
        if (sunMoonContainer) {
            const moonPhase = getMoonPhase(new Date());
            sunMoonContainer.innerHTML = `
                <div class="sun-time">
                    <div class="time-icon">
                        <i class="fas fa-sun" style="color: #FFA500;"></i>
                    </div>
                    <div class="time-info">
                        <span>${lang === 'es' ? 'Amanecer' : 'Sunrise'}</span>
                        <span>${formatTime(sunrise, lang)}</span>
                    </div>
                </div>
                <div class="sun-time">
                    <div class="time-icon">
                        <i class="fas fa-moon" style="color: #4682B4;"></i>
                    </div>
                    <div class="time-info">
                        <span>${lang === 'es' ? 'Atardecer' : 'Sunset'}</span>
                        <span>${formatTime(sunset, lang)}</span>
                    </div>
                </div>
                <div class="moon-phase">
                    <div class="moon-icon">
                        <span style="font-size: 1.5rem;">${moonPhase.emoji}</span>
                    </div>
                    <div class="moon-info">
                        <span>${lang === 'es' ? 'Fase Lunar' : 'Moon Phase'}</span>
                    </div>
                </div>
            `;
        }

        // Marine data
        setContent('swell-height', `${marineData.hourly?.wave_height?.[0]?.toFixed(1) ?? '--'} m`);
        setContent('swell-period', `${marineData.hourly?.wave_period?.[0] ?? '--'} s`);

        // Surf rating
        const surfRating = calculateSurfRating(
            marineData.hourly?.wave_height?.[0] ?? 0,
            marineData.hourly?.wave_period?.[0] ?? 0
        );
        updateSurfRating(surfRating.rating, surfRating.text, lang);
    }

    function getMoonPhase(date) {
        const year = date.getFullYear();
        let month = date.getMonth();
        const day = date.getDate();
        
        let c, e, jd, b;
        
        if (month < 3) {
            year--;
            month += 12;
        }
        
        month++;
        c = 365.25 * year;
        e = 30.6 * month;
        jd = c + e + day - 694039.09;
        jd /= 29.5305882;
        b = parseInt(jd);
        jd -= b;
        b = Math.round(jd * 8);
        
        if (b >= 8) b = 0;
        
        const phases = [
            { emoji: '🌑', es: 'Luna nueva', en: 'New moon' },
            { emoji: '🌒', es: 'Luna creciente', en: 'Waxing crescent' },
            { emoji: '🌓', es: 'Cuarto creciente', en: 'First quarter' },
            { emoji: '🌔', es: 'Luna gibosa creciente', en: 'Waxing gibbous' },
            { emoji: '🌕', es: 'Luna llena', en: 'Full moon' },
            { emoji: '🌖', es: 'Luna gibosa menguante', en: 'Waning gibbous' },
            { emoji: '🌗', es: 'Cuarto menguante', en: 'Last quarter' },
            { emoji: '🌘', es: 'Luna menguante', en: 'Waning crescent' }
        ];
        
        return phases[b];
    }

    function showError(lang, message) {
        const errorMsg = message || (lang === 'es' ? 
            'Error cargando datos meteorológicos' : 
            'Error loading weather data');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMsg;
        
        const weatherContainer = document.getElementById('weather');
        if (weatherContainer) {
            weatherContainer.prepend(errorElement);
            setTimeout(() => errorElement.remove(), 5000);
        }
    }

    function showWarning(lang, message) {
        const warningElement = document.createElement('div');
        warningElement.className = 'error-message';
        warningElement.style.background = '#fff3e0';
        warningElement.style.borderLeft = '4px solid #ffa000';
        warningElement.textContent = message;
        
        const weatherContainer = document.getElementById('weather');
        if (weatherContainer) {
            weatherContainer.prepend(warningElement);
            setTimeout(() => warningElement.remove(), 5000);
        }
    }

    function degToCompass(deg) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const val = Math.floor((deg / 22.5) + 0.5);
        return directions[(val % 16)];
    }

    function formatTime(date, lang) {
        const options = { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        };
        return date.toLocaleTimeString(lang === 'es' ? 'es-CR' : 'en-US', options);
    }

    function calculateSurfRating(height, period) {
        const score = (height * 0.6) + (period * 0.4);
        
        if (score < 1) return { rating: 1, text: { es: 'Muy pobre', en: 'Very poor' } };
        if (score < 2) return { rating: 2, text: { es: 'Pobre', en: 'Poor' } };
        if (score < 3) return { rating: 3, text: { es: 'Regular', en: 'Fair' } };
        if (score < 4) return { rating: 4, text: { es: 'Bueno', en: 'Good' } };
        return { rating: 5, text: { es: 'Excelente', en: 'Excellent' } };
    }

    function updateSurfRating(rating, text, lang) {
        const starsContainer = document.querySelector('.rating-stars');
        if (!starsContainer) return;
        
        starsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsContainer.innerHTML += i <= rating 
                ? '<i class="fas fa-star"></i>' 
                : '<i class="far fa-star"></i>';
        }
        
        const ratingText = document.getElementById('surf-rating-text');
        if (ratingText) ratingText.textContent = lang === 'es' ? text.es : text.en;
    }

    document.getElementById('location-select').addEventListener('change', function() {
        const lang = document.documentElement.lang;
        loadWeather(lang);
    });

    // News Loader
    const newsFeedEs = [
        { 
            title: 'Nuevas Rutas de Senderismo en la Zona Norte', 
            date: '15 Octubre 2023',
            excerpt: 'Ampliación de nuestro programa Modo Chill con 5 nuevas rutas accesibles.',
            image: 'Assets/Images/aleksandar-popovski-IIEJoyFkAPI-unsplash.jpg'
        },
        { 
            title: 'Premio al Mejor Programa Comunitario 2023', 
            date: '10 Octubre 2023',
            excerpt: 'Reconocimiento nacional por nuestro impacto en el desarrollo sostenible.',
            image: 'Assets/Images/alfonso-castro-HaGwCk2AD84-unsplash.jpg'
        },
        { 
            title: 'Talleres de Capacitación para Guías Locales', 
            date: '5 Septiembre 2023',
            excerpt: 'Formación especializada para miembros de comunidades en turismo sostenible.',
            image: 'Assets/Images/bernd-dittrich-Y3GT-msn_LE-unsplash.jpg'
        }
    ];

    const newsFeedEn = [
        { 
            title: 'New Hiking Trails in the Northern Zone', 
            date: 'October 15, 2023',
            excerpt: 'Expansion of our Modo Chill program with 5 new accessible trails.',
            image: 'Assets/Images/aleksandar-popovski-IIEJoyFkAPI-unsplash.jpg'
        },
        { 
            title: 'Best Community Program Award 2023', 
            date: 'October 10, 2023',
            excerpt: 'National recognition for our impact on sustainable development.',
            image: 'Assets/Images/alfonso-castro-HaGwCk2AD84-unsplash.jpg'
        },
        { 
            title: 'Training Workshops for Local Guides', 
            date: 'September 5, 2023',
            excerpt: 'Specialized training for community members in sustainable tourism.',
            image: 'Assets/Images/bernd-dittrich-Y3GT-msn_LE-unsplash.jpg'
        }
    ];

    function loadNews(lang = 'es') {
        const newsContainer = document.getElementById('news-feed');
        if (!newsContainer) return;
        
        newsContainer.innerHTML = '';
        const newsItems = lang === 'es' ? newsFeedEs : newsFeedEn;
        
        newsItems.forEach(item => {
            const article = document.createElement('article');
            article.className = 'news-card';
            article.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="news-content">
                    <p class="news-date">${item.date}</p>
                    <h3>${item.title}</h3>
                    <p>${item.excerpt}</p>
                    <a href="#" class="btn" style="margin-top: 1rem; display: inline-block;" 
                       data-es="Leer Más" data-en="Read More">${lang === 'es' ? 'Leer Más' : 'Read More'}</a>
                </div>
            `;
            newsContainer.appendChild(article);
        });
    }

    // Newsletter Form Submission
    document.getElementById('newsletter-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input').value;
        const lang = document.documentElement.lang;
        
        // In a real implementation, you would send this to your server
        console.log(`Subscribed email (${lang}):`, email);
        
        // Show success message
        const successMsg = lang === 'es' 
            ? '¡Gracias por suscribirte! Pronto recibirás nuestras actualizaciones.' 
            : 'Thank you for subscribing! You will receive our updates soon.';
        
        alert(successMsg);
        this.reset();
    });

    // Contact Form Submission
    document.getElementById('contact-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const lang = document.documentElement.lang;
        
        // In a real implementation, you would send this to your server
        console.log('Form submitted');
        
        // Show success message
        const successMsg = lang === 'es' 
            ? '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.' 
            : 'Message sent successfully! We will contact you soon.';
        
        alert(successMsg);
        this.reset();
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize
    setLanguage('es');
    loadNews('es');
    animateCounters();
    loadWeather('es');
    initImpactMap('es');
    
    // Close mobile menu if open when resizing
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '☰';
        }
    });
});