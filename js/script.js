/* =====================================================
   CURASOAP — script de la page
   Tout ce que vous pouvez vouloir modifier est dans la
   section « RÉGLAGES » juste en dessous.
   ===================================================== */
'use strict';

/* ===================== RÉGLAGES ===================== */

// Numéro WhatsApp qui reçoit les commandes (indicatif + numéro, sans « + » ni espaces)
const WHATSAPP_NUMBER = '2290169777434';

// Pays proposés dans le formulaire.
// Bénin, Côte d’Ivoire et Sénégal : prix en FCFA. France : prix en euros (voir OFFERS.eur).
const COUNTRIES = {
  BJ: { name: 'Bénin',         prefix: '+229', euro: false, city: 'Ex : Cotonou, Akpakpa' },
  CI: { name: 'Côte d’Ivoire', prefix: '+225', euro: false, city: 'Ex : Abidjan, Cocody' },
  SN: { name: 'Sénégal',       prefix: '+221', euro: false, city: 'Ex : Dakar, Plateau' },
  FR: { name: 'France',        prefix: '+33',  euro: true,  city: 'Ex : Paris 18e' }
};

// Offres : nombre de savons, sacs offerts, prix en FCFA et équivalent en euros (1 € ≈ 656 FCFA)
const OFFERS = {
  1:  { soaps: 1,  bags: 1,  fcfa: 5000,  eur: 7.6  },
  3:  { soaps: 3,  bags: 3,  fcfa: 10000, eur: 15.2 },
  15: { soaps: 15, bags: 15, fcfa: 35000, eur: 53.5 }
};

// Mots qui défilent sous le titre : « Idéal pour … »
const TYPED_WORDS = [
  'les taches brunes',
  'l’hyperpigmentation',
  'les aisselles foncées',
  'les genoux et coudes',
  'l’entre-cuisses',
  'les marques d’acné'
];

/* ===================== OUTILS ===================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===================== TITRES ANIMÉS ===================== */
function splitWords(root){
  let i = 0;
  (function walk(node){
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.className = 'wi';
          inner.style.transitionDelay = (i++ * 70) + 'ms';
          inner.textContent = part;
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1){ walk(n); }
    });
  })(root);
}

const splitEls = $$('.split');
splitEls.forEach(splitWords);

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.25 });
splitEls.forEach(el => revealObserver.observe(el));
$$('[data-reveal]').forEach(el => revealObserver.observe(el));

/* ===================== BULLES ===================== */
(function bubbles(){
  const box = $('#bubbles');
  if (!box || reduceMotion) return;
  for (let i = 0; i < 14; i++){
    const b = document.createElement('span');
    const size = 10 + Math.random() * 56;
    b.className = 'bubble';
    b.style.width = b.style.height = size + 'px';
    b.style.left = (Math.random() * 96) + '%';
    b.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
    b.style.animationDuration = (11 + Math.random() * 14) + 's';
    b.style.animationDelay = (-Math.random() * 20) + 's';
    box.appendChild(b);
  }
})();

/* ===================== MOTS QUI S’ÉCRIVENT ===================== */
(function typed(){
  const el = $('#typed');
  if (!el || reduceMotion) return;
  let w = 0, c = 0, del = false;
  el.textContent = '';
  (function tick(){
    const word = TYPED_WORDS[w];
    if (!del){
      c++; el.textContent = word.slice(0, c);
      if (c === word.length){ del = true; return setTimeout(tick, 1700); }
      return setTimeout(tick, 70);
    }
    c--; el.textContent = word.slice(0, c);
    if (c === 0){ del = false; w = (w + 1) % TYPED_WORDS.length; return setTimeout(tick, 320); }
    setTimeout(tick, 35);
  })();
})();

/* =====================================================
   CARROUSEL DES CRÉATIVES
   - la vidéo au centre se lance toute seule, avec le son
   - si le navigateur bloque le son : lecture muette + bouton jaune
     « Touchez pour le son » (le 1er toucher n’importe où l’active)
   - à la fin d’une vidéo, on passe à la suivante
   ===================================================== */
(function reel(){
  const track = $('#reelTrack');
  const slides = $$('.slide', track);
  if (!track || !slides.length) return;

  let current = -1;
  let soundWanted = true;   // on essaie d’abord avec le son
  let blocked = false;      // le navigateur a refusé le son
  let visible = true;       // le carrousel est à l’écran
  let voiceOn = false;      // un témoignage audio est en cours
  let manualPause = false;

  const ICON_ON  = '<svg class="i-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18.5 6a9 9 0 010 12"/></svg>';
  const ICON_OFF = '<svg class="i-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';

  slides.forEach((s, i) => {
    const v = $('video', s);
    v.muted = true; v.loop = false;

    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'snd';
    btn.innerHTML = ICON_ON + ICON_OFF + '<span class="lbl">Touchez pour le son</span>';
    btn.setAttribute('aria-label', 'Activer ou couper le son');
    s.appendChild(btn);

    const st = document.createElement('div');
    st.className = 'slide-state';
    st.innerHTML = '<span><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
    s.appendChild(st);

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const vid = activeVideo();
      if (!vid) return;
      if (vid.muted){ enableSound(); } else { vid.muted = true; soundWanted = false; refreshSnd(); }
    });

    s.addEventListener('click', () => {
      if (i !== nearest()){ goTo(i); return; }
      const vid = $('video', s);
      if (blocked || vid.muted){ enableSound(); return; }
      if (vid.paused){ manualPause = false; vid.play().catch(()=>{}); s.classList.remove('is-paused'); }
      else { manualPause = true; vid.pause(); s.classList.add('is-paused'); }
    });

    v.addEventListener('ended', () => { if (i === current) goTo((i + 1) % slides.length); });
  });

  const activeVideo = () => current >= 0 ? $('video', slides[current]) : null;

  function centerOffset(i){
    const s = slides[i];
    return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2;
  }
  function nearest(){
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  }
  function goTo(i){
    track.scrollTo({ left: centerOffset(i), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function refreshSnd(){
    slides.forEach((s, i) => {
      const b = $('.snd', s), v = $('video', s);
      b.classList.toggle('is-muted', i === current && v.muted);
    });
  }

  async function playActive(){
    const v = activeVideo();
    if (!v || !visible || voiceOn || manualPause || document.hidden) return;
    v.muted = !soundWanted || blocked;
    try { await v.play(); }
    catch (err){
      if (!v.muted){
        // son refusé par le navigateur → lecture muette + bouton jaune
        v.muted = true; blocked = true;
        try { await v.play(); } catch (e2){}
      }
    }
    refreshSnd();
  }

  function enableSound(){
    blocked = false; soundWanted = true;
    const v = activeVideo();
    if (!v) return;
    v.muted = false;
    if (v.paused && !manualPause && visible && !voiceOn){
      v.play().catch(() => { v.muted = true; blocked = true; refreshSnd(); });
    }
    refreshSnd();
  }

  function activate(i){
    if (i === current) return;
    const prev = current;
    current = i;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      if (k !== i){
        const v = $('video', s);
        if (!v.paused) v.pause();
        if (k === prev) v.currentTime = 0;
        s.classList.remove('is-paused');
      }
    });
    manualPause = false;
    // précharge la vidéo courante et la suivante
    [i, (i + 1) % slides.length].forEach(k => { $('video', slides[k]).preload = 'auto'; });
    playActive();
  }

  // suivi du défilement : mise en avant immédiate, lecture quand le doigt s’arrête
  let raf = 0, idle = 0;
  function markNear(){
    const n = nearest();
    slides.forEach((s, k) => s.classList.toggle('is-near', k === n));
  }
  track.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; markNear(); });
    clearTimeout(idle);
    idle = setTimeout(() => activate(nearest()), 130);
  }, { passive: true });

  // flèches + clavier
  const step = d => goTo((nearest() + d + slides.length) % slides.length);
  $('#reelPrev').addEventListener('click', () => step(-1));
  $('#reelNext').addEventListener('click', () => step(1));
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
  });

  // le premier vrai clic/touche débloque le son si le navigateur l’avait refusé
  function unlock(){
    if (!blocked) return;
    enableSound();
  }
  document.addEventListener('click', unlock);
  document.addEventListener('keydown', unlock);

  // pause quand le carrousel sort de l’écran ou que l’onglet est caché
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    const v = activeVideo();
    if (!visible){ if (v) v.pause(); } else { playActive(); }
  }, { threshold: 0.35 }).observe($('#reel'));

  document.addEventListener('visibilitychange', () => {
    const v = activeVideo();
    if (document.hidden){ if (v) v.pause(); } else { playActive(); }
  });

  // un témoignage audio coupe la vidéo
  document.addEventListener('voice:start', () => { voiceOn = true; const v = activeVideo(); if (v) v.pause(); });
  document.addEventListener('voice:stop',  () => { voiceOn = false; playActive(); });

  // démarrage (le CSS est déjà chargé : la mise en page est connue)
  track.scrollLeft = centerOffset(0);
  markNear();
  activate(0);
})();

/* =====================================================
   GALERIE PRODUIT + AGRANDISSEMENT
   ===================================================== */
(function gallery(){
  const thumbs = $$('.g-thumb');
  const main = $('#gMain');
  const stage = $('#gStage');
  if (!thumbs.length) return;

  const items = thumbs.map(t => ({ src: t.dataset.src, alt: t.dataset.alt }));
  let idx = 0, token = 0;

  function preload(i){ const im = new Image(); im.src = items[(i + items.length) % items.length].src; }

  function show(i){
    idx = (i + items.length) % items.length;
    const my = ++token;
    main.classList.add('swap');
    const im = new Image();
    im.onload = im.onerror = () => {
      if (my !== token) return;
      main.src = items[idx].src; main.alt = items[idx].alt;
      main.classList.remove('swap');
      if (!lb.hidden){ lbImg.src = items[idx].src; lbImg.alt = items[idx].alt; }
    };
    im.src = items[idx].src;
    thumbs.forEach((t, k) => t.classList.toggle('is-on', k === idx));
    preload(idx + 1);
  }

  thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  $('#gPrev').addEventListener('click', () => show(idx - 1));
  $('#gNext').addEventListener('click', () => show(idx + 1));

  // glisser au doigt
  function swipe(el, onLeft, onRight){
    let x0 = 0, y0 = 0, on = false;
    el.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (!on) return; on = false;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3){ dx < 0 ? onLeft() : onRight(); }
    }, { passive: true });
  }
  swipe(stage, () => show(idx + 1), () => show(idx - 1));

  // agrandissement plein écran
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  function openLb(){
    lbImg.src = items[idx].src; lbImg.alt = items[idx].alt;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    $('#cta').classList.add('is-hidden');
  }
  function closeLb(){
    lb.hidden = true; document.body.style.overflow = '';
    $('#cta').classList.remove('is-hidden');
    document.dispatchEvent(new Event('cta:refresh'));
  }
  main.addEventListener('click', openLb);
  $('#gZoom').addEventListener('click', openLb);
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('#lbNext').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbImg) closeLb(); });
  swipe(lb, () => show(idx + 1), () => show(idx - 1));
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });

  preload(1);
})();

/* =====================================================
   TÉMOIGNAGES AUDIO
   ===================================================== */
(function voices(){
  const cards = $$('.voice-card');
  if (!cards.length) return;
  const hint = $('#voiceHint');
  const N = 40;
  const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

  cards.forEach((card, ci) => {
    const audio = $('audio', card), btn = $('.vplay', card), wave = $('.wave', card);
    const cur = $('.cur', card), dur = $('.dur', card);

    // barres du signal sonore
    for (let i = 0; i < N; i++){
      const b = document.createElement('i');
      const h = 22 + Math.abs(Math.sin(i * 1.7 + ci * 2.3) * Math.cos(i * .53 + ci)) * 68;
      b.style.setProperty('--h', h.toFixed(0) + '%');
      b.style.setProperty('--d', ((i * 83) % 700) + 'ms');
      wave.appendChild(b);
    }
    const bars = [...wave.children];
    const paint = () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      bars.forEach((b, i) => b.classList.toggle('on', (i + 1) / N <= p + 0.001));
      cur.textContent = fmt(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', () => { if (isFinite(audio.duration)) dur.textContent = fmt(Math.round(audio.duration)); });
    audio.addEventListener('timeupdate', paint);

    audio.addEventListener('play', () => {
      cards.forEach(o => { if (o !== card){ const a = $('audio', o); if (!a.paused) a.pause(); } });
      card.classList.add('is-playing', 'was-played');
      if (hint) hint.classList.add('is-gone');
      document.dispatchEvent(new Event('voice:start'));
    });
    const stop = () => {
      card.classList.remove('is-playing');
      if (cards.every(o => $('audio', o).paused)) document.dispatchEvent(new Event('voice:stop'));
    };
    audio.addEventListener('pause', stop);
    audio.addEventListener('ended', () => { audio.currentTime = 0; paint(); stop(); });

    btn.addEventListener('click', () => { audio.paused ? audio.play().catch(() => {}) : audio.pause(); });

    // toucher le signal pour se déplacer dans le message
    const seek = clientX => {
      const r = wave.getBoundingClientRect();
      if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * audio.duration;
      paint();
    };
    wave.addEventListener('click', e => seek(e.clientX));
    wave.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    });
  });
})();

/* =====================================================
   FORMULAIRE → WHATSAPP
   ===================================================== */
(function order(){
  const form = $('#orderForm');
  if (!form) return;

  const clean = s => s.replace(/[\u202f\u00a0]/g, ' ');
  const nf = n => clean(n.toLocaleString('fr-FR'));

  function priceParts(offerKey, countryKey){
    const o = OFFERS[offerKey], c = COUNTRIES[countryKey];
    return c.euro
      ? { num: clean(o.eur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })), cur: '€' }
      : { num: nf(o.fcfa), cur: 'FCFA' };
  }
  const price = (k, ck) => { const p = priceParts(k, ck); return p.num + ' ' + p.cur; };
  const priceHtml = (k, ck) => { const p = priceParts(k, ck); return `<span class="pn">${p.num}</span><span class="pc">${p.cur}</span>`; };
  function offerLabel(k){
    const o = OFFERS[k];
    return `${o.soaps} savon${o.soaps > 1 ? 's' : ''} + ${o.bags} sac${o.bags > 1 ? 's' : ''} à savon offert${o.bags > 1 ? 's' : ''}`;
  }
  const country = () => form.country.value;
  const offer = () => form.offer.value;

  function refresh(){
    const c = COUNTRIES[country()];
    $$('[data-price]').forEach(el => { el.innerHTML = priceHtml(el.dataset.price, country()); });
    $('#prefix').textContent = c.prefix;
    $('#fCity').placeholder = c.city;
    $('#recapText').textContent = offerLabel(offer());
    $('#recapPrice').innerHTML = priceHtml(offer(), country());

    // prix sur le bouton fixe
    const o = OFFERS[offer()];
    const ctaOffer = $('#ctaOffer'), ctaPrice = $('#ctaPrice');
    if (ctaOffer && ctaPrice){
      const txt = price(offer(), country());
      ctaOffer.textContent = o.soaps + ' savon' + (o.soaps > 1 ? 's' : '');
      if (ctaPrice.textContent !== txt){
        ctaPrice.textContent = txt;
        ctaPrice.classList.remove('pop'); void ctaPrice.offsetWidth; ctaPrice.classList.add('pop');
      }
    }
  }
  form.addEventListener('change', refresh);

  // pré-sélection : les visiteurs situés en Europe voient la France
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.indexOf('Europe/') === 0) form.country.value = 'FR';
  } catch (e) {}
  refresh();

  const btn = $('#submitBtn'), label = $('#submitLabel');
  const original = label.textContent;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const c = COUNTRIES[country()];
    let phone = $('#fPhone').value.trim().replace(/\s+/g, ' ');
    // si la personne a déjà tapé l'indicatif (+229… ou 00229…), on le garde tel quel
    if (!/^(\+|00)/.test(phone)){
      if (country() === 'FR') phone = phone.replace(/^0/, '');
      phone = c.prefix + ' ' + phone;
    }
    const msg =
`Bonjour CuraSoap 👋
Je souhaite commander :

🧼 Offre : ${offerLabel(offer())}
💰 Total : ${price(offer(), country())}
🌍 Pays : ${c.name}

👤 Nom : ${$('#fName').value.trim()}
📞 Téléphone : ${phone}
📍 Ville / quartier : ${$('#fCity').value.trim()}
🧭 Point de repère : ${$('#fLandmark').value.trim()}`;

    const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    btn.disabled = true; label.textContent = 'Ouverture de WhatsApp…';
    setTimeout(() => { window.location.href = url; }, 250);
    setTimeout(() => { btn.disabled = false; label.textContent = original; }, 4000);
  });

  window.addEventListener('pageshow', () => { btn.disabled = false; label.textContent = original; });
})();

/* =====================================================
   BOUTON FIXE « Je fais rayonner ma peau » + prix de l'offre choisie
   - visible partout, il affiche le prix de la sélection en cours
   - il se range quand le bouton d'envoi du formulaire est à l'écran
   - pendant que l'on remplit le formulaire, un appui envoie la commande
   ===================================================== */
(function cta(){
  const btn = $('#cta'), form = $('#orderForm'), send = $('#submitBtn');
  if (!btn || !form || !send) return;
  let sendVisible = false;

  new IntersectionObserver(([e]) => {
    sendVisible = e.isIntersecting;
    btn.classList.toggle('is-hidden', sendVisible);
  }, { threshold: 0.6 }).observe(send);
  document.addEventListener('cta:refresh', () => btn.classList.toggle('is-hidden', sendVisible));

  btn.addEventListener('click', e => {
    const r = form.getBoundingClientRect();
    const inView = r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.45;
    if (inView){
      e.preventDefault();
      if (form.requestSubmit) form.requestSubmit(); else send.click();
    }
  });
})();
