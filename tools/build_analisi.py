#!/usr/bin/env python3
"""Genera le pagine di analisi/ a partire dai frammenti in analisi/_contenuti/.

Uso:  python3 tools/build_analisi.py

Ogni frammento è HTML puro (vedi analisi/_contenuti/FORMATO.md): una
<section class="sec" id="..."> per argomento, con un <h2> che diventa voce
dell'indice. Lo script aggiunge intestazione, indice, navigazione tra capitoli,
barre per esercizi e quiz, e scrive analisi/<slug>.html.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "analisi" / "_contenuti"
OUT = ROOT / "analisi"

# Numerazione: le parti del "Programma dettagliato primo parziale" (prof. De Martino).
CHAPTERS = [
    {"slug": "reali", "k": "Parte 1", "title": "Numeri reali e disequazioni",
     "desc": "Insiemi numerici, irrazionalità di √2, induzione e Bernoulli, sup e inf, potenze e logaritmi, disequazioni.",
     "materiale": ["Lezioni 1–2", "Disequazioni.pdf"]},
    {"slug": "complessi", "k": "Parte 2", "title": "Numeri complessi",
     "desc": "Forma algebrica, trigonometrica ed esponenziale, De Moivre, radici n-esime, equazioni e disegni nel piano di Gauss.",
     "materiale": ["Lezioni 3–4", "complessiquest.pdf"]},
    {"slug": "funzioni", "k": "Parte 3", "title": "Funzioni: generalità",
     "desc": "Dominio e immagine, iniettive, suriettive, biiettive, composta e inversa, funzioni limitate, simmetriche, monotone, periodiche.",
     "materiale": ["Lezioni 5–6"]},
    {"slug": "successioni", "k": "Parte 4", "title": "Limiti di successioni",
     "desc": "Definizioni di limite, teoremi (unicità, permanenza del segno, carabinieri, monotone), numero e, gerarchia degli infiniti, asintotici.",
     "materiale": ["Lezioni 6–10", "formulario Asintotici"]},
    {"slug": "serie", "k": "Parte 5", "title": "Serie numeriche",
     "desc": "Serie di riferimento, condizione necessaria, confronto, rapporto, radice, convergenza assoluta, Leibniz, serie con parametro.",
     "materiale": ["Lezioni 11–13", "Esercizi su serie.pdf"]},
]
EXTRAS = [
    {"slug": "dimostrazioni", "k": "Dimostrazioni", "title": "Le 14 dimostrazioni del primo parziale",
     "desc": "Le dimostrazioni che possono essere chieste nella parte di teoria della prima prova in itinere, con la traccia da ricordare."},
    {"slug": "prova-itinere", "k": "Prova", "title": "Prima prova in itinere: com'è fatta",
     "desc": "Struttura e soglie della prova, cosa esce di solito, risposte di teoria brevi, errori tipici e strategia per l'ora d'esame."},
    {"slug": "prove-svolte", "k": "Prove svolte", "title": "Prove in itinere passate svolte",
     "desc": "Le prime prove in itinere degli anni scorsi, svolte passo per passo."},
    {"slug": "simulazione", "k": "Simulazione", "title": "Simulazione del prof (Esercitazione 7)",
     "desc": "La simulazione del primo parziale fatta in esercitazione: 6 domande di test, una serie con parametro ed esercizi di ripasso, con le soluzioni ricalcolate."},
    {"slug": "piano", "k": "Piano", "title": "Piano di studio fino al 2 novembre",
     "desc": "Cosa fare ora per ora sabato 31 ottobre, domenica 1 e la mattina della prova."},
]
ALL = CHAPTERS + EXTRAS

ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'

HEAD = """<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../assets/gal.css">
<script>try{{var t=localStorage.getItem('gal:theme');if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
</head>
<body data-page="{slug}">
<header class="topbar">
  <div class="in">
    <button class="iconbtn menu-btn" id="menu-btn" aria-label="Apri l'indice" aria-expanded="false" aria-controls="side">{menu}</button>
    <nav class="crumbs" aria-label="Percorso">
      <a href="../" class="hide-sm">Appunti</a><span class="sep hide-sm">/</span>
      <a href="./">Analisi 1</a>{crumb}
    </nav>
    <button class="iconbtn" id="theme-btn" aria-label="Cambia tema chiaro/scuro">{sun}</button>
  </div>
  <div class="readbar"></div>
</header>
"""

FOOT = """<script>
  window.MathJax = {
    tex: { inlineMath: [['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]']], tags: 'none' },
    svg: { fontCache: 'global' },
    options: { skipHtmlTags: ['script','noscript','style','textarea','pre','code'] }
  };
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js" async></script>
<script src="../assets/gal.js"></script>
</body>
</html>
"""

SEC_RE = re.compile(r'<section\b([^>]*)>', re.I)
H2_RE = re.compile(r'<h2\b[^>]*>(.*?)</h2>', re.I | re.S)
TAG_RE = re.compile(r'<[^>]+>')


def plain(s):
    return html.unescape(TAG_RE.sub("", s)).strip()


def attr(attrs, name):
    m = re.search(r'\b' + name + r'\s*=\s*"([^"]*)"', attrs)
    return m.group(1) if m else None


def split_sections(frag):
    """Restituisce [(attrs, body)] per ogni <section> di primo livello."""
    out = []
    pos = 0
    while True:
        m = SEC_RE.search(frag, pos)
        if not m:
            break
        depth, i = 1, m.end()
        while depth:
            o = frag.find("<section", i)
            c = frag.find("</section>", i)
            if c < 0:
                raise ValueError("<section> non chiusa")
            if 0 <= o < c:
                depth += 1
                i = o + 8
            else:
                depth -= 1
                i = c + 10
        out.append((m.group(1), frag[m.end():i - 10]))
        pos = i
    return out


IMP_RE = re.compile(r'(<div class="tag">[^\n]*?) · (molto avanzato|essenziale|utile|avanzato)\s*</div>')


def render_main(slug, frag):
    """Arricchisce le sezioni e costruisce l'indice della pagina."""
    # livello di importanza del prof ("Definizione 2.1 · essenziale") -> badge
    frag = IMP_RE.sub(lambda m: f'{m.group(1)}<span class="imp" data-imp="{m.group(2).replace(" ", "-")}">{m.group(2)}</span></div>', frag)
    frag = re.sub(r'(?<!<div class="tablewrap">)(<table\b.*?</table>)', r'<div class="tablewrap">\1</div>', frag, flags=re.S)
    toc, parts, n_ex, n_quiz = [], [], 0, 0
    for idx, (attrs, body) in enumerate(split_sections(frag), 1):
        sid = attr(attrs, "id") or f"{slug}-s{idx}"
        classes = (attr(attrs, "class") or "sec").split()
        h2 = H2_RE.search(body)
        title = plain(h2.group(1)) if h2 else f"Sezione {idx}"
        has_ex = 'class="ex"' in body or "class='ex'" in body or re.search(r'class="ex[ "]', body)
        has_quiz = 'class="quiz' in body
        extra = ""
        if has_ex:
            classes.append("esercizi")
            k = len(re.findall(r'class="ex[ "]', body))
            n_ex += k
            levels = [l for l in ("base", "medio", "esame") if f'data-livello="{l}"' in body]
            chips = ['<button class="chip" data-filter="tutti" aria-pressed="true">Tutti</button>',
                     '<button class="chip" data-filter="da-fare" aria-pressed="false">Da fare</button>']
            chips += [f'<button class="chip" data-filter="{l}" aria-pressed="false">{l.capitalize()}</button>' for l in levels]
            extra = ('<div class="ex-bar">' + "".join(chips) +
                     '<button class="chip toggle-sol" aria-pressed="false">Mostra soluzioni</button>'
                     '<span class="count ex-count"></span></div>')
        elif has_quiz:
            classes.append("quizzes")
            n_quiz += body.count('class="quiz"')
            extra = ('<div class="ex-bar"><span class="quiz-score"></span>'
                     '<button class="chip quiz-reset">Ricomincia</button></div>')
        if h2 and extra:
            body = body[:h2.end()] + "\n  " + extra + body[h2.end():]
        num = f'<div class="num">{idx:02d}</div>'
        cls = " ".join(dict.fromkeys(classes))
        parts.append(f'<section class="{cls}" id="{sid}">\n  {num}{body}</section>')
        toc.append((sid, title, idx))
    return "\n\n".join(parts), toc, n_ex, n_quiz


def side_panel(slug, toc, totals, has_adv=False):
    ch = []
    for c in ALL:
        cur = ' aria-current="page"' if c["slug"] == slug else ""
        k = c["k"].replace("Parte ", "") if c in CHAPTERS else "·"
        ch.append(f'<li><a href="{c["slug"]}.html"{cur}><span class="k">{k}</span>{html.escape(c["title"])}</a>')
        if totals.get(c["slug"]):
            ch.append(f'<div class="chap-progress" data-progress-page="{c["slug"]}" data-total="{totals[c["slug"]]}"><i></i></div>')
        ch.append("</li>")
    tools = ""
    if has_adv:
        tools = ('<div class="panel"><div class="panel-title">Studio</div>'
                 '<button class="iconbtn" id="toggle-adv" aria-pressed="false" style="width:100%">Nascondi le parti avanzate</button></div>')
    t = "".join(f'<li><a href="#{sid}"><span class="k">{i:02d}</span>{html.escape(title)}</a></li>' for sid, title, i in toc)
    return f"""<aside class="side" id="side">
      <div class="panel"><div class="panel-title">Pagine</div><ol>{''.join(ch)}</ol></div>
      <div class="panel"><div class="panel-title">In questa pagina</div><ol id="toc">{t}</ol></div>
      {tools}
    </aside>"""


def pager(slug):
    i = [c["slug"] for c in ALL].index(slug)
    out = ['<nav class="pager" aria-label="Capitoli">']
    if i > 0:
        p = ALL[i - 1]
        out.append(f'<a class="prev" href="{p["slug"]}.html"><small>← Precedente</small><span>{html.escape(p["title"])}</span></a>')
    if i + 1 < len(ALL):
        n = ALL[i + 1]
        out.append(f'<a class="next" href="{n["slug"]}.html"><small>Successivo →</small><span>{html.escape(n["title"])}</span></a>')
    out.append("</nav>")
    return "".join(out)


def build_page(c, totals_out):
    path = SRC / f"{c['slug']}.html"
    frag = path.read_text(encoding="utf-8") if path.exists() else ""
    if frag.strip():
        main, toc, n_ex, n_quiz = render_main(c["slug"], frag)
    else:
        main = ('<div class="empty"><p><strong>Contenuti in arrivo.</strong></p>'
                '<p>Questo capitolo verrà riempito con teoria, esempi ed esercizi svolti tratti dagli appunti del corso.</p></div>')
        toc, n_ex, n_quiz = [], 0, 0
    totals_out[c["slug"]] = n_ex
    return frag.strip() != "", main, toc, n_ex, n_quiz


def write_page(c, main, toc, n_ex, n_quiz, totals):
    pills = [f'<span class="pill">{len(toc)} sezioni</span>'] if toc else []
    if n_ex:
        pills.append(f'<span class="pill">{n_ex} esercizi con soluzione</span>')
    if n_quiz:
        pills.append(f'<span class="pill">{n_quiz} domande di quiz</span>')
    for m in c.get("materiale", []):
        pills.append(f'<span class="pill">{html.escape(m)}</span>')
    head = HEAD.format(title=f'{c["k"]} · {c["title"]} — Analisi Matematica 1', desc=html.escape(c["desc"]),
                       slug=c["slug"], menu=ICON_MENU, sun=ICON_SUN,
                       crumb=f'<span class="sep">/</span><span class="here">{html.escape(c["k"])}</span>')
    body = f"""<div class="page">
  <header class="hero">
    <span class="eyebrow">{html.escape(c["k"])}</span>
    <h1>{html.escape(c["title"])}</h1>
    <p class="sub">{html.escape(c["desc"])}</p>
    <div class="pillrow">{''.join(pills)}</div>
  </header>
  <div class="layout">
    {side_panel(c["slug"], toc, totals, 'data-imp="avanzato"' in main or 'data-imp="molto-avanzato"' in main)}
    <main id="content">
{main}
      {pager(c["slug"])}
    </main>
  </div>
  <footer class="foot">Appunti personali basati sul materiale del corso di Analisi Matematica 1 del prof. De Martino (Politecnico di Milano, 2026/27). Possono contenere errori: nel dubbio fa fede il materiale del docente.</footer>
</div>
"""
    (OUT / f'{c["slug"]}.html').write_text(head + body + FOOT, encoding="utf-8")


def write_hub(ready, totals):
    lezioni = []
    lj = SRC / "lezioni.json"
    if lj.exists():
        lezioni = json.loads(lj.read_text(encoding="utf-8"))
    cards = []
    for c in ALL:
        soon = "" if ready.get(c["slug"]) else " soon"
        meta = [f'<span class="pill">{html.escape(m)}</span>' for m in c.get("materiale", [])]
        if not ready.get(c["slug"]):
            meta.append('<span class="pill">in arrivo</span>')
        if totals.get(c["slug"]):
            meta.append(f'<span class="pill" data-progress-label>{totals[c["slug"]]} esercizi</span>')
            meta.append(f'<span class="bar" data-progress-page="{c["slug"]}" data-total="{totals[c["slug"]]}"><i></i></span>')
        cards.append(f'''<a class="chap{soon}" href="{c["slug"]}.html">
        <span class="k">{html.escape(c["k"])}</span><h3>{html.escape(c["title"])}</h3>
        <p>{html.escape(c["desc"])}</p><span class="meta">{''.join(meta)}</span></a>''')
    tl = ""
    if lezioni:
        items = []
        for l in sorted(lezioni, key=lambda x: x.get("data", ""), reverse=True):
            cap = l.get("capitolo")
            link = f' · <a href="cap{cap}.html">Cap. {cap}</a>' if cap is not None else ""
            note = f'<div>{html.escape(l["note"])}</div>' if l.get("note") else ""
            items.append(f'<li><div class="d">Lezione {l.get("n", "")} · {html.escape(l.get("data", ""))}{link}</div>'
                         f'<strong>{html.escape(l.get("titolo", ""))}</strong>{note}</li>')
        tl = f'<section><h2>Lezioni</h2><ol class="timeline">{"".join(items)}</ol></section>'
    head = HEAD.format(title="Analisi Matematica 1 — Appunti", desc="Appunti, dimostrazioni ed esercizi svolti per la prima prova in itinere di Analisi Matematica 1.",
                       slug="hub", menu="", sun=ICON_SUN, crumb="").replace(
        '<button class="iconbtn menu-btn" id="menu-btn" aria-label="Apri l\'indice" aria-expanded="false" aria-controls="side"></button>', "")
    body = f"""<div class="page">
  <header class="hero">
    <span class="eyebrow">Politecnico di Milano · Primo anno · 2026/27</span>
    <h1>Analisi Matematica 1</h1>
    <p class="sub">Programma della prima prova in itinere (2 novembre 2026), prof. De Martino. Una parte del programma per pagina: definizioni e teoremi, il metodo per ogni tipo di esercizio ed esercizi d'esame svolti con la soluzione nascosta. Spunta gli esercizi fatti: l'avanzamento resta salvato in questo browser.</p>
  </header>
  <div class="hub">
    <section><h2>Programma</h2><div class="chapters">{''.join(cards)}</div></section>
    {tl}
    <section><h2>Da scaricare e stampare</h2><div class="res">
      <div class="panel"><h3>PDF</h3><ul><li><a href="pdf/bigino-analisi1-itinere1.pdf">Bigino (8 pagine)</a></li><li><a href="pdf/esercizi-svolti-analisi1-itinere1.pdf">Esercizi tipo svolti (6 pagine)</a></li><li><a href="pdf/piano-studio-analisi1.pdf">Piano di studio (3 pagine)</a></li></ul></div>
      <div class="panel"><h3>Tutto il corso</h3><ul><li><a href="../analisi1.html">Riassunto di tutto il programma</a> (anche derivate, integrali, Taylor: non sono nella prima prova)</li></ul></div>
    </div></section>
    <section><h2>Come usare il sito</h2><div class="res">
      <div class="panel"><h3>Studia</h3><ul><li>Box viola: definizioni</li><li>Bordo scuro: teoremi</li><li>Box verde: il metodo passo per passo</li><li>Box arancione: errori tipici</li></ul></div>
      <div class="panel"><h3>Esercitati</h3><ul><li>Prova l'esercizio prima di aprire la soluzione</li><li>Filtra per livello o per “da fare”</li><li>Il livello “esame” viene dalle prove in itinere passate</li></ul></div>
      <div class="panel"><h3>Ripeti</h3><ul><li>Le definizioni e le 14 dimostrazioni valgono metà della soglia</li><li>In stampa le soluzioni si aprono da sole</li></ul></div>
    </div></section>
  </div>
  <footer class="foot">Appunti personali basati sul materiale del corso. Possono contenere errori: nel dubbio fa fede il materiale del docente.</footer>
</div>
"""
    (OUT / "index.html").write_text(head + body + FOOT, encoding="utf-8")


def main():
    totals, ready, pages = {}, {}, []
    for c in ALL:
        ok, *rest = build_page(c, totals)
        ready[c["slug"]] = ok
        pages.append((c, rest))
    for c, (main_html, toc, n_ex, n_quiz) in pages:
        write_page(c, main_html, toc, n_ex, n_quiz, totals)
    write_hub(ready, totals)
    print("Pagine generate:", ", ".join(f'{c["slug"]}{"" if ready[c["slug"]] else " (vuota)"}' for c in ALL))


if __name__ == "__main__":
    main()
