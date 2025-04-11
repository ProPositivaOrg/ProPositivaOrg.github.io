// script.js
const API_CONFIG = {
    weather: {
        url: 'https://api.open-meteo.com/v1/forecast',
        params: '&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature&daily=sunrise,sunset&timezone=auto'
    },
    marine: {
        url: 'https://marine-api.open-meteo.com/v1/marine',
        params: '&hourly=wave_height,wave_period'
    }
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

    // Weather API Integration
    async function loadWeather(lang = 'es') {
        try {
            const locationSelect = document.getElementById('location-select');
            const [lat, lon] = locationSelect.value.split(',');
            const loadingElement = document.getElementById('weather-loading');
            
            // Show loading state
            loadingElement.style.display = 'flex';
            document.querySelectorAll('.weather-card').forEach(card => {
                card.classList.add('loading');
            });

            // Fetch data with error handling
            const [weatherData, marineData] = await Promise.all([
                fetchWeatherData(lat, lon),
                fetchMarineData(lat, lon)
            ]);

            // Update UI
            updateWeatherUI(weatherData, marineData, lang);
            
        } catch (error) {
            console.error("Error loading weather:", error);
            showError(lang);
        } finally {
            // Hide loading state
            document.getElementById('weather-loading').style.display = 'none';
            document.querySelectorAll('.weather-card').forEach(card => {
                card.classList.remove('loading');
            });
        }
    }

    async function fetchWeatherData(lat, lon) {
        const url = `${API_CONFIG.weather.url}?latitude=${lat}&longitude=${lon}${API_CONFIG.weather.params}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API failed');
        return await response.json();
    }

    async function fetchMarineData(lat, lon) {
        const url = `${API_CONFIG.marine.url}?latitude=${lat}&longitude=${lon}${API_CONFIG.marine.params}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Marine API failed');
        return await response.json();
    }

    function updateWeatherUI(weatherData, marineData, lang) {
        // Current weather
        document.getElementById('current-temp').textContent = weatherData.current_weather.temperature;
        document.getElementById('feels-like').textContent = `${weatherData.hourly.apparent_temperature[0]}°C`;
        document.getElementById('humidity').textContent = `${weatherData.hourly.relativehumidity_2m[0]}%`;
        
        // Weather icon
        const weatherCode = weatherData.current_weather.weathercode;
        document.getElementById('current-icon').innerHTML = `<i class="${WEATHER_ICONS[weatherCode] || 'fas fa-question'}"></i>`;
        
        // Sun times
        const sunrise = new Date(weatherData.daily.sunrise[0]);
        const sunset = new Date(weatherData.daily.sunset[0]);
        document.getElementById('sunrise').textContent = formatTime(sunrise, lang);
        document.getElementById('sunset').textContent = formatTime(sunset, lang);
        
        // Moon phase
        const moonPhase = getMoonPhase(new Date());
        document.getElementById('moon-phase').textContent = lang === 'es' ? moonPhase.es : moonPhase.en;
        
        // Marine data
        document.getElementById('swell-height').textContent = `${marineData.hourly.wave_height[0].toFixed(1)} m`;
        document.getElementById('swell-period').textContent = `${marineData.hourly.wave_period[0]} s`;
        
        // Surf rating
        const surfRating = calculateSurfRating(
            marineData.hourly.wave_height[0],
            marineData.hourly.wave_period[0]
        );
        updateSurfRating(surfRating.rating, surfRating.text, lang);
    }

    function showError(lang) {
        const errorMsg = lang === 'es' ? 
            'Error cargando datos meteorológicos. Intente nuevamente más tarde.' : 
            'Error loading weather data. Please try again later.';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMsg;
        
        const weatherDiv = document.getElementById('weather');
        weatherDiv.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
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
        starsContainer.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsContainer.innerHTML += '<i class="fas fa-star"></i>';
            } else {
                starsContainer.innerHTML += '<i class="far fa-star"></i>';
            }
        }
        
        document.getElementById('surf-rating-text').textContent = lang === 'es' ? text.es : text.en;
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
                    <a href="#" class="btn" style="margin-top: 1rem; display: inline-block;" data-es="Leer Más" data-en="Read More">${lang === 'es' ? 'Leer Más' : 'Read More'}</a>
                </div>
            `;
            newsContainer.appendChild(article);
        });
    }

    // Newsletter Form Submission
    document.getElementById('newsletter-form').addEventListener('submit', function(e) {
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
    document.getElementById('contact-form').addEventListener('submit', function(e) {
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
    
    // Close mobile menu if open when resizing
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '☰';
        }
    });
});