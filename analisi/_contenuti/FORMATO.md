# Formato dei contenuti per il sito di Analisi 1

Sezione Analisi Matematica 1 del sito `Birtita/appuntiBirtita` (cartella `analisi/`), generata da
`python3 tools/build_analisi.py` a partire dai frammenti in `analisi/_contenuti/`. Copia di lavoro condivisa:
`/mnt/project-files/analisi1/sito-contenuti/`. Una pagina per parte del programma del primo parziale:

- `reali.html` Numeri reali, sup/inf, disequazioni (id con prefisso `reali-`)
- `complessi.html` Numeri complessi (`complessi-`)
- `funzioni.html` Funzioni: generalità (`funzioni-`)
- `successioni.html` Limiti di successioni (`successioni-`)
- `serie.html` Serie numeriche (`serie-`)
- `dimostrazioni.html` Le 14 dimostrazioni (`dim-`)
- `prova-itinere.html` Struttura della prova, teoria breve, errori tipici (`prova-`)
- `prove-svolte.html` Prime prove in itinere passate svolte (`prove-`), scritto dal thread "Svolgere prove in itinere di Analisi"
- `piano.html` Piano di studio (`piano-`)

Gli slug sono diversi da quelli di geometria (cap0…, esami, bigino) perché l'avanzamento degli
esercizi è salvato in localStorage con chiave `gal:done:<slug>:<id>`: non usare `esami.html`.
Gli esercizi d'esame hanno `data-livello="esame"` e `data-fonte="Prova in itinere GG-MM-AAAA"`.

## Struttura di un file capitolo

```html
<section class="sec" id="cap1-matrici">        <!-- id univoco, prefisso capN- -->
  <h2>Matrici</h2>
  <p class="lead">Una frase di inquadramento.</p>

  <div class="box box--def"><div class="tag">Definizione 1.1</div> ... </div>
  <div class="box box--thm"><div class="tag">Teorema 1.5</div><h4>Teorema di Rouché–Capelli</h4> ... </div>
  <div class="box box--ex"><div class="tag">Esempio</div> ... </div>
  <div class="box box--warn"><div class="tag">Attenzione</div> errore tipico ... </div>
  <div class="box box--note"><div class="tag">Dalla lezione</div> commento del prof ... </div>
  <div class="box box--method"><div class="tag">Metodo</div><ol><li>passo</li>...</ol></div>
</section>

<!-- Esercizi: sempre con soluzione nascosta -->
<section class="sec" id="cap1-esercizi">
  <h2>Esercizi</h2>
  <div class="ex" data-fonte="Foglio 3, es. 2" data-livello="base|medio|esame">
    <div class="ex-testo"> testo con formule </div>
    <details class="hint"><summary>Suggerimento</summary> ... </details>   <!-- facoltativo -->
    <details class="sol"><summary>Soluzione</summary> soluzione passo per passo </details>
  </div>
</section>

<!-- Quiz vero/falso o a scelta multipla -->
<section class="sec" id="cap1-quiz">
  <h2>Quiz</h2>
  <div class="quiz" data-risposta="V">           <!-- V/F oppure lettera A/B/C/D -->
    <p>Enunciato</p>
    <ol class="opzioni"><li>...</li><li>...</li></ol>   <!-- solo per scelta multipla -->
    <details class="sol"><summary>Spiegazione</summary> ... </details>
  </div>
</section>
```

## Regole
- Formule in LaTeX: inline `\( ... \)`, display `\[ ... \]` (MathJax 3). Niente `$...$`.
- Una `<section class="sec">` per argomento: ogni `<h2>` diventa una voce dell'indice laterale.
  `<h3>` per sottoparagrafi.
- Nessun CSS o JS inline; usate solo le classi sopra (se serve una classe nuova, scrivetela qui sotto).
- Figure: SVG inline dentro `<figure class="fig">...<figcaption>..</figcaption></figure>`, colori con `currentColor`.
- Indicate la fonte (capitolo/pagina, foglio, esame) in `data-fonte` o nel tag del box.

## Classi aggiunte (thread analisi lezioni)
- `<p class="verifica">Verificata con calcolo simbolico</p>` / `Verificata a mano`: ultima riga di una soluzione
  di un esercizio senza soluzione ufficiale, per indicare che è stata ricontrollata. Se la soluzione è ufficiale:
  `<p class="verifica">Soluzione ufficiale</p>`.
- `<table>` semplice (con `<thead>`/`<tbody>`) usata in `esami.html` (struttura dell'esame, argomenti ricorrenti): va stilizzata.
