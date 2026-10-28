/* Geometria e Algebra Lineare — interazioni delle pagine di studio.
   Tutto è un miglioramento progressivo: senza JS la pagina resta leggibile. */
(function(){
  var store = {
    get: function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set: function(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
    del: function(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  var root = document.documentElement;
  var page = document.body.getAttribute('data-page') || '';

  /* ---- tema chiaro/scuro ---- */
  var saved = store.get('gal:theme');
  if (saved) root.setAttribute('data-theme', saved);
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn){
    themeBtn.addEventListener('click', function(){
      var dark = root.getAttribute('data-theme') === 'dark' ||
        (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = dark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('gal:theme', next);
    });
  }

  /* ---- menu laterale su mobile ---- */
  var menuBtn = document.getElementById('menu-btn');
  if (menuBtn){
    menuBtn.addEventListener('click', function(){
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('aside.side a').forEach(function(a){
      a.addEventListener('click', function(){ document.body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded','false'); });
    });
  }

  /* ---- barra di lettura + indice attivo ---- */
  var bar = document.querySelector('.readbar');
  if (bar){
    var onScroll = function(){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('#toc a'));
  var targets = tocLinks.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
  if ('IntersectionObserver' in window && tocLinks.length){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var i = targets.indexOf(en.target);
        if (i < 0) return;
        tocLinks.forEach(function(l){ l.classList.remove('active'); });
        tocLinks[i].classList.add('active');
      });
    }, {rootMargin:'-15% 0px -70% 0px'});
    targets.forEach(function(t){ if (t) obs.observe(t); });
  }

  /* ---- esercizi: intestazione, fatto/non fatto, filtri ---- */
  var exs = Array.prototype.slice.call(document.querySelectorAll('.ex'));
  function doneKey(ex){ return 'gal:done:' + page + ':' + ex.id; }
  exs.forEach(function(ex, i){
    if (!ex.id) ex.id = page + '-ex' + (i + 1);
    var head = document.createElement('div');
    head.className = 'ex-head';
    var n = document.createElement('span'); n.className = 'n'; head.appendChild(n);
    var lvl = ex.getAttribute('data-livello');
    if (lvl){ var l = document.createElement('span'); l.className = 'lvl'; l.setAttribute('data-l', lvl); l.textContent = lvl; head.appendChild(l); }
    var src = ex.getAttribute('data-fonte');
    if (src){ var s = document.createElement('span'); s.className = 'src'; s.textContent = src; head.appendChild(s); }
    var lab = document.createElement('label'); lab.className = 'done-toggle';
    var cb = document.createElement('input'); cb.type = 'checkbox';
    cb.checked = store.get(doneKey(ex)) === '1';
    ex.classList.toggle('done', cb.checked);
    cb.addEventListener('change', function(){
      ex.classList.toggle('done', cb.checked);
      if (cb.checked) store.set(doneKey(ex), '1'); else store.del(doneKey(ex));
      updateCount();
    });
    lab.appendChild(cb); lab.appendChild(document.createTextNode('Fatto'));
    head.appendChild(lab);
    ex.insertBefore(head, ex.firstChild);
  });

  /* ogni sezione di esercizi ha la sua barra: filtri, contatore, mostra soluzioni */
  function updateCount(){
    document.querySelectorAll('section.esercizi').forEach(function(sec){
      var el = sec.querySelector('.ex-count'); if (!el) return;
      var list = sec.querySelectorAll('.ex'), d = sec.querySelectorAll('.ex.done').length;
      el.textContent = d + '/' + list.length + ' fatti';
    });
  }
  updateCount();
  document.querySelectorAll('section.esercizi').forEach(function(sec){
    var chips = Array.prototype.slice.call(sec.querySelectorAll('.chip[data-filter]'));
    var list = Array.prototype.slice.call(sec.querySelectorAll('.ex'));
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        chips.forEach(function(o){ o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        var f = c.getAttribute('data-filter');
        list.forEach(function(ex){
          ex.hidden = !(f === 'tutti' || (f === 'da-fare' ? !ex.classList.contains('done') : ex.getAttribute('data-livello') === f));
        });
      });
    });
    var allSol = sec.querySelector('.toggle-sol');
    if (allSol) allSol.addEventListener('click', function(){
      var open = allSol.getAttribute('aria-pressed') !== 'true';
      allSol.setAttribute('aria-pressed', open ? 'true' : 'false');
      allSol.textContent = open ? 'Nascondi soluzioni' : 'Mostra soluzioni';
      list.forEach(function(ex){ ex.querySelectorAll('details.sol').forEach(function(d){ d.open = open; }); });
    });
  });

  /* ---- quiz: rispondi e ricevi subito il feedback; punteggio per sezione ---- */
  function updateScore(sec){
    var el = sec && sec.querySelector('.quiz-score'); if (!el) return;
    var qs = sec.querySelectorAll('.quiz[data-risposta]');
    var ans = sec.querySelectorAll('.quiz[data-answered]').length, ok = sec.querySelectorAll('.quiz[data-answered="ok"]').length;
    el.textContent = ok + ' corrette su ' + ans + ' risposte (' + qs.length + ' domande)';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.quiz[data-risposta]'), function(q){
    var sec = q.closest('section');
    var correct = q.getAttribute('data-risposta').trim().toUpperCase();
    var opts = q.querySelectorAll('ol.opzioni > li');
    var labels = opts.length ? Array.prototype.map.call(opts, function(_, i){ return String.fromCharCode(65 + i); }) : ['V', 'F'];
    var row = document.createElement('div'); row.className = 'quiz-answers';
    var fb = document.createElement('span'); fb.className = 'quiz-feedback'; fb.setAttribute('aria-live', 'polite');
    labels.forEach(function(lb){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = lb === 'V' ? 'Vero' : lb === 'F' ? 'Falso' : lb;
      b.addEventListener('click', function(){
        row.querySelectorAll('button').forEach(function(x, i){ x.disabled = true; if (labels[i] === correct) x.classList.add('right'); });
        if (lb === correct){ q.setAttribute('data-answered', 'ok'); fb.textContent = 'Giusto!'; fb.style.color = 'var(--ok)'; }
        else { q.setAttribute('data-answered', 'ko'); b.classList.add('wrong'); fb.textContent = 'Sbagliato'; fb.style.color = 'var(--ko)'; }
        var sol = q.querySelector('details.sol'); if (sol) sol.open = true;
        updateScore(sec);
      });
      row.appendChild(b);
    });
    row.appendChild(fb);
    var sol = q.querySelector('details.sol');
    q.insertBefore(row, sol || null);
  });
  document.querySelectorAll('section.quizzes').forEach(function(sec){
    updateScore(sec);
    var reset = sec.querySelector('.quiz-reset');
    if (reset) reset.addEventListener('click', function(){
      sec.querySelectorAll('.quiz[data-risposta]').forEach(function(q){
        q.removeAttribute('data-answered');
        q.querySelectorAll('.quiz-answers button').forEach(function(b){ b.disabled = false; b.classList.remove('right', 'wrong'); });
        var fb = q.querySelector('.quiz-feedback'); if (fb) fb.textContent = '';
        var sol = q.querySelector('details.sol'); if (sol) sol.open = false;
      });
      updateScore(sec);
    });
  });

  /* ---- hub: avanzamento per capitolo ---- */
  document.querySelectorAll('[data-progress-page]').forEach(function(el){
    var p = el.getAttribute('data-progress-page'), tot = +el.getAttribute('data-total') || 0, d = 0;
    try{
      for (var i = 0; i < localStorage.length; i++){
        if (localStorage.key(i).indexOf('gal:done:' + p + ':') === 0) d++;
      }
    }catch(e){}
    var fill = el.querySelector('i'); if (fill && tot) fill.style.width = Math.min(100, d / tot * 100) + '%';
    if (d) el.classList.add('has');
    var lab = el.parentNode.querySelector('[data-progress-label]'); if (lab && tot) lab.textContent = d + '/' + tot + ' esercizi';
  });

  /* ---- importanza (essenziale/utile/avanzato): nascondi le parti avanzate ---- */
  document.querySelectorAll('.imp').forEach(function(b){
    var box = b.closest('.box'); if (box) box.setAttribute('data-imp', b.getAttribute('data-imp'));
  });
  var advBtn = document.getElementById('toggle-adv');
  function setAdv(hide){
    document.body.classList.toggle('hide-adv', hide);
    if (advBtn){ advBtn.setAttribute('aria-pressed', hide ? 'true' : 'false'); advBtn.textContent = hide ? 'Mostra anche le parti avanzate' : 'Nascondi le parti avanzate'; }
  }
  if (advBtn){
    setAdv(store.get('gal:hide-adv') === '1');
    advBtn.addEventListener('click', function(){
      var hide = !document.body.classList.contains('hide-adv');
      setAdv(hide); if (hide) store.set('gal:hide-adv', '1'); else store.del('gal:hide-adv');
    });
  }

  /* ---- formule in linea troppo larghe (es. matrici su telefono): scorrono da sole ---- */
  function fitWideMath(){
    document.querySelectorAll('mjx-container:not([display="true"])').forEach(function(m){
      m.classList.remove('wide');
      var box = m.parentElement;
      if (box && m.getBoundingClientRect().width > box.getBoundingClientRect().width) m.classList.add('wide');
    });
  }
  (function waitMathJax(n){
    if (window.MathJax && MathJax.startup && MathJax.startup.promise){
      MathJax.startup.promise.then(fitWideMath);
      var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(fitWideMath, 200); });
    } else if (n < 100) setTimeout(function(){ waitMathJax(n + 1); }, 100);
  })(0);
  document.addEventListener('toggle', function(e){ if (e.target.open) fitWideMath(); }, true);

  /* ---- in stampa apri tutto ---- */
  window.addEventListener('beforeprint', function(){ document.querySelectorAll('details').forEach(function(d){ d.open = true; }); });
})();
