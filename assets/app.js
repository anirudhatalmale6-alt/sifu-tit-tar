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
