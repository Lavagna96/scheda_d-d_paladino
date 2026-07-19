# Regole di collaborazione — Scheda D&D Paladino

Regole da rispettare SEMPRE in questo progetto, in ogni sessione.

## Flusso di lavoro

1. **Mai commit o deploy senza permesso esplicito.** Chiedi sempre prima di
   fare `git commit` o `git push`: l'utente potrebbe voler accumulare più
   modifiche in una sessione e deployare una sola volta alla fine. Il
   permesso vale per il singolo commit/deploy, non per tutta la sessione.

2. **Testa sempre in locale prima del deploy.** Usa il server locale
   (config "scheda" in `.claude/launch.json`, porta 5599) e verifica le
   modifiche nel browser di anteprima (interazioni, console senza errori,
   screenshot) prima di proporre il deploy. Per provare dal telefono
   (stessa Wi-Fi): `http://<IP-LAN>:5599/index.html` — l'IP del Mac è
   dinamico, ricavalo ogni volta con `ipconfig getifaddr en0`.

3. **Fai domande prima di iniziare se manca contesto.** Se la richiesta è
   ambigua o ci sono più interpretazioni possibili, chiedi chiarimenti
   PRIMA di scrivere codice, non dopo.

4. **Proponi sempre 3 alternative con preview.** Per modifiche di design,
   UX o funzionalità, presenta tre versioni con anteprime visive (mockup
   interattivi o screenshot) così l'utente può vedere cosa intendi e
   scegliere.

5. **Chiedi approvazione prima di applicare le modifiche.** Dopo che
   l'utente ha scelto un'alternativa, implementala; non applicare
   modifiche al codice basate solo su una tua proposta non confermata.

## Messaggi di commit

- Convenzione: `tipo(argomento): descrizione` — tipi standard:
  `feat` (nuova funzionalità), `fix` (correzione di bug),
  `chore` (manutenzione, config, dipendenze); quando servono anche
  `style` (solo resa visiva), `refactor`, `docs`.
- L'argomento è il modulo o l'area toccata (es. `pf`, `swipe`,
  `oggetti`, `tesoreria`, `cloud`).
- La descrizione è sintetica e parlante: dice cosa cambia per chi usa
  l'app, in italiano, senza giri di parole
  (es. `feat(pf): popup dedicato per danno e cura`).
- Se serve contesto, dopo una riga vuota aggiungi un corpo breve con il
  perché della modifica e le scelte non ovvie.
- **Nessuna firma nei commit**: niente `Co-Authored-By`, niente
  "Generated with Claude" o simili. Il messaggio contiene SOLO quanto
  previsto dalla convenzione qui sopra.

## Note tecniche del progetto

- Sito statico (no framework): `index.html` + `css/` + `js/`, deploy su
  GitHub Pages (push su `main` → https://lavagna96.github.io/scheda_d-d_paladino/).
- **Cache busting**: a ogni modifica di CSS/JS incrementa `?v=N` sia in
  `index.html` sia negli `@import` di `css/styles.css` (devono avere lo
  stesso numero).
- Dopo un deploy autorizzato: controlla il run di GitHub Actions via API
  e verifica con `curl` che il sito live serva davvero i nuovi contenuti.
- Target principale: iPhone in modalità standalone (PWA da home screen).
  Attenzione a viewport, safe-area e tastiera iOS.
- Lingua del progetto e dei commit: italiano (commit in stile
  `feat(scope): descrizione`).
- Cloud: Firebase (progetto `scheda-dnd-8d651`, account personale) —
  Auth + Firestore, sync in `js/cloud.js`, config in `js/firebase-config.js`.
- **Fonte ufficiale regole D&D 5.5**: SOLO il PDF locale
  `/Users/andrealavagna/Documents/D&D/Dungeons and Dragons Players Handbook 2024.pdf`
  (leggerlo con `pdftotext -layout -f <da> -l <a> "<pdf>" -`). Non cercare
  regole sul web né andare a memoria: ogni dato di gioco (tabelle, liste,
  incantesimi, tratti) va verificato lì. Nell'app e nel DB vanno però solo
  riassunti originali in italiano, MAI il testo integrale (copyright).
