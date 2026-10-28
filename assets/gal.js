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

  var countEl = document.getElementById('ex-count');
  function updateCount(){
    if (!countEl) return;
    var d = exs.filter(function(e){ return e.classList.contains('done'); }).length;
    countEl.textContent = d + '/' + exs.length + ' fatti';
  }
  updateCount();

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  chips.forEach(function(c){
    c.addEventListener('click', function(){
      chips.forEach(function(o){ o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
      var f = c.getAttribute('data-filter');
      exs.forEach(function(ex){
        var show = f === 'tutti' || (f === 'da-fare' ? !ex.classList.contains('done') : ex.getAttribute('data-livello') === f);
        ex.hidden = !show;
      });
    });
  });
  var allSol = document.getElementById('toggle-sol');
  if (allSol){
    allSol.addEventListener('click', function(){
      var open = allSol.getAttribute('aria-pressed') !== 'true';
      allSol.setAttribute('aria-pressed', open ? 'true' : 'false');
      allSol.textContent = open ? 'Nascondi soluzioni' : 'Mostra soluzioni';
      document.querySelectorAll('.ex details.sol').forEach(function(d){ d.open = open; });
    });
  }

  /* ---- quiz: rispondi e ricevi subito il feedback ---- */
  var quizzes = Array.prototype.slice.call(document.querySelectorAll('.quiz[data-risposta]'));
  var scoreEl = document.getElementById('quiz-score');
  var answered = 0, right = 0;
  function updateScore(){ if (scoreEl) scoreEl.textContent = right + ' corrette su ' + answered + ' risposte (' + quizzes.length + ' domande)'; }
  quizzes.forEach(function(q){
    var correct = q.getAttribute('data-risposta').trim().toUpperCase();
    var opts = q.querySelectorAll('ol.opzioni > li');
    var labels = opts.length ? Array.prototype.map.call(opts, function(_, i){ return String.fromCharCode(65 + i); }) : ['V', 'F'];
    var row = document.createElement('div'); row.className = 'quiz-answers';
    var fb = document.createElement('span'); fb.className = 'quiz-feedback'; fb.setAttribute('aria-live', 'polite');
    labels.forEach(function(lb){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = lb === 'V' ? 'Vero' : lb === 'F' ? 'Falso' : lb;
      b.addEventListener('click', function(){
        var buttons = row.querySelectorAll('button');
        buttons.forEach(function(x, i){ x.disabled = true; if (labels[i] === correct) x.classList.add('right'); });
        answered++;
        if (lb === correct){ right++; fb.textContent = 'Giusto!'; fb.style.color = 'var(--ok)'; }
        else { b.classList.add('wrong'); fb.textContent = 'Sbagliato'; fb.style.color = 'var(--ko)'; }
        var sol = q.querySelector('details.sol'); if (sol) sol.open = true;
        updateScore();
      });
      row.appendChild(b);
    });
    row.appendChild(fb);
    var sol = q.querySelector('details.sol');
    q.insertBefore(row, sol || null);
  });
  updateScore();
  var resetQuiz = document.getElementById('quiz-reset');
  if (resetQuiz) resetQuiz.addEventListener('click', function(){ location.hash = 'quiz'; location.reload(); });

  /* ---- hub: avanzamento per capitolo ---- */
  document.querySelectorAll('[data-progress-page]').forEach(function(el){
    var p = el.getAttribute('data-progress-page'), tot = +el.getAttribute('data-total') || 0, d = 0;
    try{
      for (var i = 0; i < localStorage.length; i++){
        if (localStorage.key(i).indexOf('gal:done:' + p + ':') === 0) d++;
      }
    }catch(e){}
    var fill = el.querySelector('i'); if (fill && tot) fill.style.width = Math.min(100, d / tot * 100) + '%';
    var lab = el.parentNode.querySelector('[data-progress-label]'); if (lab && tot) lab.textContent = d + '/' + tot + ' esercizi';
  });

  /* ---- in stampa apri tutto ---- */
  window.addEventListener('beforeprint', function(){ document.querySelectorAll('details').forEach(function(d){ d.open = true; }); });
})();
