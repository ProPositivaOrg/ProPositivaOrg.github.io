// script.js
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
            // In a real implementation, replace with actual API key
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=San%20Jose,CR&units=metric&lang=${lang}&appid=YOUR_API_KEY`);
            const data = await response.json();
            
            const weatherDiv = document.getElementById('weather');
            if (lang === 'es') {
                weatherDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                        <div style="text-align: center; padding: 1rem;">
                            <h3>${data.name}</h3>
                            <p style="font-size: 2rem; font-weight: bold; color: var(--accent);">${Math.round(data.main.temp)}°C</p>
                            <p>${data.weather[0].description}</p>
                        </div>
                        <div style="text-align: center; padding: 1rem;">
                            <p>Humedad: ${data.main.humidity}%</p>
                            <p>Viento: ${data.wind.speed} m/s</p>
                        </div>
                    </div>
                `;
            } else {
                weatherDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                        <div style="text-align: center; padding: 1rem;">
                            <h3>${data.name}</h3>
                            <p style="font-size: 2rem; font-weight: bold; color: var(--accent);">${Math.round(data.main.temp)}°C</p>
                            <p>${data.weather[0].description}</p>
                        </div>
                        <div style="text-align: center; padding: 1rem;">
                            <p>Humidity: ${data.main.humidity}%</p>
                            <p>Wind: ${data.wind.speed} m/s</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error loading weather:", error);
            const weatherDiv = document.getElementById('weather');
            if (lang === 'es') {
                weatherDiv.innerHTML = `<p>Información climática no disponible actualmente</p>`;
            } else {
                weatherDiv.innerHTML = `<p>Weather information currently unavailable</p>`;
            }
        }
    }

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
    
    // Close mobile menu if open when resizing
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '☰';
        }
    });
});