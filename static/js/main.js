document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header scroll effect
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // 2. Mobile Nav Hamburger Toggle
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const hamburgerLines = document.querySelectorAll('.hamburger-line');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', navMenu.classList.contains('active'));
      
      // Animate hamburger to 'X'
      if (navMenu.classList.contains('active')) {
        hamburgerLines[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
        hamburgerLines[1].style.opacity = '0';
        hamburgerLines[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
      } else {
        hamburgerLines[0].style.transform = 'none';
        hamburgerLines[1].style.opacity = '1';
        hamburgerLines[2].style.transform = 'none';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburgerLines[0].style.transform = 'none';
        hamburgerLines[1].style.opacity = '1';
        hamburgerLines[2].style.transform = 'none';
      }
    });
  }

  // 3. FAQ Accordion (Admissions Page)
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const content = header.nextElementSibling;
      const isActive = item.classList.contains('active');

      // Close all other accordion items
      document.querySelectorAll('.accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.accordion-content').style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // 4. Gallery Category Filters
  const filterTabs = document.querySelectorAll('.filter-tab');
  const galleryCards = document.querySelectorAll('.gallery-card');

  if (filterTabs.length > 0 && galleryCards.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab styles
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;

        galleryCards.forEach(card => {
          const category = card.dataset.category;
          if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // 5. Gallery Lightbox Modal
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (lightbox && galleryCards.length > 0 && lightboxImg) {
    galleryCards.forEach(card => {
      card.addEventListener('click', () => {
        const img = card.querySelector('.gallery-card-img');
        const title = card.querySelector('.gallery-card-title');
        
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt || 'School Gallery Photo';
          if (lightboxCaption && title) {
            lightboxCaption.textContent = title.textContent;
          } else if (lightboxCaption) {
            lightboxCaption.textContent = img.alt;
          }
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden'; // Stop scrolling
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      lightboxImg.src = '';
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // 6. Form Submit Visual Feedbacks (Admission Inquiry & Contact Us)
  const contactForm = document.getElementById('contactForm');
  const inquiryForm = document.getElementById('inquiryForm');

  const setupFormHandling = (form) => {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic client-side validation
      let isValid = true;
      const requiredInputs = form.querySelectorAll('[required]');
      
      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#ef4444'; // Red border for error
        } else {
          input.style.borderColor = ''; // Reset
        }
      });

      if (!isValid) {
        alert('Please fill in all required fields.');
        return;
      }

      const alertBox = form.querySelector('.form-alert');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action || window.location.href, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (alertBox) {
          alertBox.style.display = 'block';
          if (data.success) {
            alertBox.textContent = data.message;
            alertBox.className = 'form-alert success';
            form.reset();
          } else {
            alertBox.textContent = data.message || 'An error occurred.';
            alertBox.className = 'form-alert';
            alertBox.style.backgroundColor = '#fef2f2';
            alertBox.style.color = '#ef4444';
          }
          // Scroll to the top of the form or alert box
          alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Hide success message after 7 seconds
          setTimeout(() => {
            alertBox.style.display = 'none';
          }, 7000);
        } else {
          alert(data.message);
          if (data.success) form.reset();
        }
      } catch (error) {
        if (alertBox) {
          alertBox.textContent = 'A network error occurred. Please try again.';
          alertBox.className = 'form-alert';
          alertBox.style.display = 'block';
        } else {
          alert('A network error occurred. Please try again.');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  };

  setupFormHandling(contactForm);
  setupFormHandling(inquiryForm);

  // 7. Scroll-Reveal Interaction (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Trigger once
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));
  }

  // 8. Count-Up Stat Numbers Animation on Viewport Entry
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length > 0) {
    const animateCounter = (el) => {
      const rawText = el.textContent.trim();
      const numMatch = rawText.match(/\d+/);
      if (!numMatch) return; // Exit if no digit found (e.g. "Modern", "Solar")

      const target = parseInt(numMatch[0], 10);
      const suffix = rawText.replace(numMatch[0], ''); // Retrieve "+" or "%" symbols
      let count = 0;
      const duration = 1500; // 1.5 seconds animation
      const interval = 1000 / 60; // 60 FPS
      const step = target / (duration / interval);

      const counterTimer = setInterval(() => {
        count += step;
        if (count >= target) {
          el.textContent = target + suffix;
          clearInterval(counterTimer);
        } else {
          el.textContent = Math.floor(count) + suffix;
        }
      }, interval);
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target); // Animate once
        }
      });
    }, {
      threshold: 0.1
    });

    statNumbers.forEach(num => {
      if (/\d+/.test(num.textContent)) {
        counterObserver.observe(num);
      }
    });
  }
});
