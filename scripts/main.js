/* ============================================
   KHANG LE PORTFOLIO - MAIN JAVASCRIPT
   Hamburger Menu, Form Validation, Smooth Scrolling
   ============================================ */

// ---- HAMBURGER MENU FUNCTIONALITY ----
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('nav');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
    });

    // Close menu when a nav link is clicked
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
      });
    });
  }

  // ---- NEWSLETTER FORM VALIDATION ----
  const newsletterForms = document.querySelectorAll('.newsletter-form');

  newsletterForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const submitButton = form.querySelector('button');
      const messageDiv = form.nextElementSibling;

      const email = emailInput.value.trim();

      // Email validation
      if (!isValidEmail(email)) {
        showMessage(messageDiv, 'Please enter a valid email address.', 'error');
        return;
      }

      // Clear any previous messages
      messageDiv.textContent = '';
      messageDiv.className = 'form-message';

      // Simulate form submission (no actual backend yet)
      submitButton.disabled = true;
      submitButton.textContent = 'Subscribing...';

      setTimeout(() => {
        showMessage(messageDiv, '✓ Thanks for subscribing! Check your email.', 'success');
        emailInput.value = '';
        submitButton.disabled = false;
        submitButton.textContent = 'Subscribe';
      }, 1000);
    });
  });

  // Email validation helper function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Show message helper function
  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;

    // Auto-hide error message after 5 seconds
    if (type === 'error') {
      setTimeout(() => {
        element.textContent = '';
        element.className = 'form-message';
      }, 5000);
    }
  }

  // ---- SMOOTH SCROLLING FOR ANCHOR LINKS ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ---- SCROLL ANIMATIONS (optional) ----
  // Add fade-in effect on scroll for project cards
  const projectCards = document.querySelectorAll('.project-card');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    projectCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }
});
