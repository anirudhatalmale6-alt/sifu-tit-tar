/* SIFU TIT TAR — interactions */

// year
document.getElementById('yr').textContent = new Date().getFullYear();

// nav shadow on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

// mobile menu
const burger = document.getElementById('burger');
const links = document.querySelector('.nav-links');
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));

// scroll reveals
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// stagger the sections that aren't hand-tagged
document.querySelectorAll('.pillars li, .card, .gallery figure, blockquote').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.animationDelay = `${(i % 4) * 0.09}s`;
  io.observe(el);
});

// reviews: reveal / hide the full Carousell set
(function moreReviews(){
  const btn = document.getElementById('moreReviews');
  if (!btn) return;
  const hidden = Array.from(document.querySelectorAll('blockquote.more-review'));
  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    hidden.forEach(el => {
      if (open) { el.hidden = false; el.classList.add('in'); }
      else { el.hidden = true; }
    });
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Show fewer reviews' : 'Read all 23 reviews';
    if (!open) document.getElementById('reviews').scrollIntoView({ behavior:'smooth', block:'start' });
  });
})();

/* Enquiry form.
   Demo build: validates, then hands off to WhatsApp so nothing is lost.
   On the live site this posts to contact.php and emails the clinic. */
const form = document.getElementById('enquiry');
const note = document.getElementById('formNote');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.name;
  const phone = form.phone;
  let ok = true;

  [name, phone].forEach(f => {
    const bad = !f.value.trim();
    f.classList.toggle('err', bad);
    if (bad) ok = false;
  });

  if (!ok) {
    note.textContent = 'Please add your name and a number I can reach you on.';
    note.classList.add('bad');
    return;
  }

  note.classList.remove('bad');
  note.textContent = 'Thank you — opening WhatsApp so I get this straight away.';

  const msg =
    `Hi Sifu, I'd like to book.\n` +
    `Name: ${name.value.trim()}\n` +
    `Phone: ${phone.value.trim()}\n` +
    `Concern: ${form.concern.value}\n` +
    `Details: ${form.message.value.trim() || '-'}`;

  setTimeout(() => {
    window.open(`https://wa.me/6590178878?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    form.reset();
  }, 600);
});

/* ==========================================================================
   BOOKING — 45 minute sessions, request based.

   Demo build: the "open" dates and the taken slots below are hard-coded so
   the client can see how it behaves. On the live WordPress site this is the
   Simply Schedule Appointments plugin: the calendar is CLOSED by default and
   Sifu opens only the dates he wants from his phone. A request emails
   sifutittar@gmail.com, he accepts or declines, and an accepted slot
   disappears for everyone else immediately.
   ========================================================================== */
(function booking(){
  const daysEl  = document.getElementById('bkDays');
  if (!daysEl) return;

  const monthEl = document.getElementById('bkMonth');
  const prevBtn = document.getElementById('bkPrev');
  const nextBtn = document.getElementById('bkNext');
  const slotsEl = document.getElementById('bkSlots');
  const hintEl  = document.getElementById('bkSlotHint');
  const formEl  = document.getElementById('bkForm');
  const stepEl  = document.getElementById('bkSlotStep');
  const chosenEl= document.getElementById('bkChosen');
  const noteEl  = document.getElementById('bkNote');

  const SESSION_MINS = 45;
  const START = [10, 0];   // first session 10:00
  const LAST  = [19, 15];  // last session starts 19:15
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  const today = new Date(); today.setHours(0,0,0,0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let picked = null;        // Date
  let pickedSlot = null;    // 'HH:MM'

  const key = d => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

  // build the 45-minute grid once
  const SLOTS = (() => {
    const out = [];
    let h = START[0], m = START[1];
    while (h < LAST[0] || (h === LAST[0] && m <= LAST[1])) {
      out.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      m += SESSION_MINS;
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
    }
    return out;
  })();

  // DEMO ONLY — pretend Sifu has opened these dates. Weekdays + Saturdays,
  // within the next 5 weeks, skipping Sundays and every 4th day (his day off).
  function isOpen(d){
    if (d < today) return false;
    const diff = Math.round((d - today) / 86400000);
    if (diff > 35) return false;
    if (d.getDay() === 0) return false;           // closed Sundays
    if (diff % 4 === 3) return false;             // Sifu's rest day
    return true;
  }
  // DEMO ONLY — a couple of slots already taken, so "taken" state is visible.
  function takenSlots(d){
    const n = d.getDate();
    return SLOTS.filter((_, i) => (i + n) % 5 === 0);
  }
  function isFull(d){ return isOpen(d) && takenSlots(d).length >= SLOTS.length; }

  function pretty(d){
    return `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]} ` +
           `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }
  function ampm(t){
    const [h, m] = t.split(':').map(Number);
    const s = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2,'0')}${s}`;
  }

  function renderMonth(){
    monthEl.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    prevBtn.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);

    daysEl.innerHTML = '';
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead  = (first.getDay() + 6) % 7;             // Monday-first
    const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

    for (let i = 0; i < lead; i++) {
      const pad = document.createElement('div');
      pad.className = 'bk-day pad';
      daysEl.appendChild(pad);
    }

    for (let n = 1; n <= total; n++) {
      const d = new Date(view.getFullYear(), view.getMonth(), n);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bk-day';
      b.textContent = n;

      if (isFull(d))      { b.classList.add('taken'); b.disabled = true; b.title = 'Fully booked'; }
      else if (isOpen(d)) {
        b.classList.add('open');
        if (picked && key(picked) === key(d)) b.classList.add('sel');
        b.addEventListener('click', () => selectDate(d));
      } else              { b.classList.add('closed'); b.disabled = true; b.title = 'Not open for booking'; }

      daysEl.appendChild(b);
    }
  }

  function selectDate(d){
    picked = d;
    pickedSlot = null;
    formEl.hidden = true;
    stepEl.hidden = false;
    renderMonth();
    renderSlots();
    slotsEl.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function renderSlots(){
    const taken = takenSlots(picked);
    hintEl.innerHTML = `<strong>${pretty(picked)}</strong> — each session runs 45 minutes.`;
    slotsEl.innerHTML = '';

    SLOTS.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bk-slot';
      const gone = taken.includes(t);
      b.innerHTML = `${ampm(t)}<small>${gone ? 'Taken' : '45 min'}</small>`;
      if (gone) { b.classList.add('gone'); b.disabled = true; }
      else b.addEventListener('click', () => selectSlot(t, b));
      slotsEl.appendChild(b);
    });
  }

  function selectSlot(t, btn){
    pickedSlot = t;
    slotsEl.querySelectorAll('.bk-slot').forEach(s => s.classList.remove('sel'));
    btn.classList.add('sel');

    chosenEl.innerHTML =
      `<strong>${pretty(picked)}</strong> at <strong>${ampm(t)}</strong> · 45 minutes · S$80`;
    stepEl.hidden = true;
    formEl.hidden = false;
    noteEl.textContent = '';
    formEl.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  // back link inside the form
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'bk-back';
  back.textContent = '← Pick a different time';
  back.addEventListener('click', () => {
    formEl.hidden = true;
    stepEl.hidden = false;
    stepEl.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  formEl.appendChild(back);

  prevBtn.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderMonth();
  });
  nextBtn.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderMonth();
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const nm = document.getElementById('bkName');
    const ph = document.getElementById('bkPhone');
    let ok = true;

    [nm, ph].forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('err', bad);
      if (bad) ok = false;
    });

    if (!ok) {
      noteEl.classList.add('bad');
      noteEl.textContent = 'Please add your name and a number Sifu can reach you on.';
      return;
    }

    noteEl.classList.remove('bad');
    noteEl.textContent = 'Request sent. Sifu will confirm — sending it to WhatsApp now so nothing is lost.';

    const msg =
      `Hi Sifu, I'd like to request a booking.\n` +
      `Date: ${pretty(picked)}\n` +
      `Time: ${ampm(pickedSlot)} (45 min)\n` +
      `Name: ${nm.value.trim()}\n` +
      `Phone: ${ph.value.trim()}\n` +
      `Problem: ${document.getElementById('bkNotes').value.trim() || '-'}`;

    setTimeout(() => {
      window.open(`https://wa.me/6590178878?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }, 700);
  });

  renderMonth();
})();
