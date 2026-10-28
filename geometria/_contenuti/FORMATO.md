# Formato dei contenuti per il sito di Geometria

Il thread "Progettare design del sito di studio" costruisce il sito in `Birtita/appuntiBirtita`
(cartella `geometria/`). Ogni pagina del sito corrisponde a un capitolo degli appunti del prof.
Scrivete i contenuti come **frammenti HTML** (niente <html>/<head>/<style>) in questa cartella,
un file per capitolo:

- `cap0.html` Fondamenti (logica, insiemi, applicazioni, ...)
- `cap1.html` Matrici e sistemi lineari
- `cap2.html` Spazi vettoriali su K
- `cap3.html` Calcolare nello spazio vettoriale standard
- `cap4.html` Applicazioni lineari
- `cap5.html` Matrice associata a un'applicazione lineare
- `cap-N.html` capitoli successivi man mano che arrivano
- `lezioni.json` (facoltativo) elenco lezioni: [{"n":11,"data":"2026-10-21","capitolo":4,"titolo":"...","note":"..."}]
- `esami.html` (facoltativo) consigli/schema ricorrente degli esami passati

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
