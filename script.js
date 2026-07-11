// Mobile menu
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if(menuBtn && mobileMenu){
  menuBtn.addEventListener('click', ()=> mobileMenu.classList.toggle('hidden'));
  mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>mobileMenu.classList.add('hidden')));
}

// Scroll reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Analytics dials (used on homepage results strip)
const dialIo = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const ring = entry.target.querySelector('.dial-ring');
      if(ring){
        const val = parseFloat(entry.target.dataset.value);
        const circumference = 263.9;
        ring.style.strokeDashoffset = circumference - (circumference*val/100);
      }
      dialIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('[data-dial]').forEach(el=>dialIo.observe(el));

// Testimonial carousel
const track = document.getElementById('testimonial-track');
const dots = document.querySelectorAll('.testi-dot');
if(track && dots.length){
  let testiIndex = 0;
  function goToTesti(i){
    testiIndex = i;
    track.style.transform = `translateX(-${i*100}%)`;
    dots.forEach((d,idx)=>{
      d.classList.toggle('bg-[color:var(--accent)]', idx===i);
      d.classList.toggle('bg-[color:var(--border-strong)]', idx!==i);
    });
  }
  dots.forEach((d,i)=>d.addEventListener('click', ()=>goToTesti(i)));
  setInterval(()=>{ goToTesti((testiIndex+1)%dots.length); }, 5500);
}

// FAQ / detail accordions
document.querySelectorAll('.accordion-toggle').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const body = btn.nextElementSibling;
    const icon = btn.querySelector('.accordion-icon');
    const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
    if(isOpen){ body.style.maxHeight = '0px'; if(icon) icon.style.transform='rotate(0deg)'; }
    else{ body.style.maxHeight = body.scrollHeight + 'px'; if(icon) icon.style.transform='rotate(45deg)'; }
  });
});

// Portfolio filter tabs
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');
if(filterBtns.length){
  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      filterBtns.forEach(b=>b.classList.remove('text-[color:var(--accent)]','border-[color:var(--accent)]'));
      btn.classList.add('text-[color:var(--accent)]','border-[color:var(--accent)]');
      const cat = btn.dataset.filter;
      portfolioItems.forEach(item=>{
        item.style.display = (cat==='all' || item.dataset.cat===cat) ? '' : 'none';
      });
    });
  });
}

// ---------- Contact system: config ----------
// ⚠️ REQUIRED: set this to your deployed backend URL before the form can work,
// e.g. "https://brand-brew-api.onrender.com/api/contact" (see /server/README.md)
const CONTACT_API_URL = "https://YOUR-BACKEND-URL/api/contact";
const CONTACT_API_CONFIGURED = !CONTACT_API_URL.includes('YOUR-BACKEND-URL');

// ⚠️ REQUIRED: replace with your real Calendly scheduling link
const CALENDLY_URL = "https://calendly.com/YOUR-HANDLE/strategy-call";
// Popup is used by default (see bookCallBtn handler below). To embed the
// calendar directly on the page instead, replace the "Book a Call" button's
// container in index.html with Calendly's inline widget div, e.g.:
//   <div class="calendly-inline-widget" data-url="YOUR_CALENDLY_URL" style="min-width:320px;height:630px;"></div>
// (the widget.js script is already loaded in index.html's <head>)

// ---------- Contact form: validation + submit ----------
const contactForm = document.getElementById('contact-form');
if(contactForm){
  const nameEl = document.getElementById('f-name');
  const emailEl = document.getElementById('f-email');
  const phoneEl = document.getElementById('f-phone');
  const serviceEl = document.getElementById('f-service');
  const messageEl = document.getElementById('f-message');
  const hpEl = document.getElementById('hp-field');
  const submitBtn = document.getElementById('contact-submit');
  const submitLabel = document.getElementById('contact-submit-label');
  const spinner = document.getElementById('contact-spinner');
  const errorEl = document.getElementById('contact-error');
  const successEl = document.getElementById('contact-success');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(el, hasError){
    const wrapper = el.closest('div');
    const msg = wrapper ? wrapper.querySelector('.field-error') : null;
    if(msg) msg.classList.toggle('hidden', !hasError);
    el.style.borderColor = hasError ? '#e5484d' : '';
  }

  function validate(){
    let valid = true;
    if(!nameEl.value.trim()){ setFieldError(nameEl, true); valid = false; } else setFieldError(nameEl, false);
    if(!emailPattern.test(emailEl.value.trim())){ setFieldError(emailEl, true); valid = false; } else setFieldError(emailEl, false);
    if(!serviceEl.value){ setFieldError(serviceEl, true); valid = false; } else setFieldError(serviceEl, false);
    if(!messageEl.value.trim()){ setFieldError(messageEl, true); valid = false; } else setFieldError(messageEl, false);
    return valid;
  }

  [nameEl, emailEl, serviceEl, messageEl].forEach(el=>{
    el.addEventListener('input', ()=> setFieldError(el, false));
    el.addEventListener('change', ()=> setFieldError(el, false));
  });

  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    errorEl.classList.add('hidden');

    // Honeypot: if a bot filled this hidden field, silently drop the submission
    if(hpEl && hpEl.value){ return; }

    if(!validate()) return;

    // Backend not connected yet — don't attempt a fetch that's guaranteed to fail.
    // Set CONTACT_API_URL above once your /server is deployed (see README).
    if(!CONTACT_API_CONFIGURED){
      errorEl.textContent = 'Our online form is finishing setup — please DM us on Instagram instead, we reply fast!';
      errorEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitLabel.textContent = 'Sending…';
    spinner.classList.remove('hidden');

    const payload = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      service: serviceEl.value,
      message: messageEl.value.trim(),
    };

    fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if(!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(() => {
        contactForm.classList.add('hidden');
        successEl.classList.remove('hidden');
        successEl.classList.add('flex');
      })
      .catch(() => {
        errorEl.textContent = 'Something went wrong sending that — please DM us on Instagram instead.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitLabel.textContent = 'Start Your Growth Journey';
        spinner.classList.add('hidden');
      });
  });
}

// ---------- Book a Call: Calendly popup ----------
const bookCallBtn = document.getElementById('book-call-btn');
if(bookCallBtn){
  bookCallBtn.addEventListener('click', ()=>{
    if(window.Calendly){
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      window.open(CALENDLY_URL, '_blank', 'noopener');
    }
  });
}

