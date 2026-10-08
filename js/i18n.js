// Internationalization: all user-facing strings in English, German, Greek,
// French, and Spanish, plus localized task-breakdown catalogs. Pure data +
// helpers, no DOM — so it can be unit-tested in Node. {placeholders} are kept
// identical across languages; symbols like ✓ and ✶ are shared.

import { DEFAULT_BREAKDOWNS } from './model.js';

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];

const MESSAGES = {
  en: {
    title: 'Momentum — one next action',
    meta_desc:
      'Momentum turns overwhelm into one next action. A private, offline focus app built for ADHD brains.',
    skip: 'Skip to the one thing',
    stat_today: 'Done today',
    stat_streak: 'Day streak',
    stat_open: 'Open',
    sec_onething: 'Your one thing right now',
    sec_braindump: 'Brain dump',
    sec_tasks: 'Everything else',
    sec_wins: 'Wins today',
    capture_ph: "What's on your mind? One thing per line is fine.",
    capture_aria: 'Add a task',
    add: 'Add',
    hint: 'Get it out of your head first. Sort it out later.',
    tasks_empty: 'Nothing here yet. Add something above.',
    wins_empty: 'No wins logged yet today. The first one is the hardest.',
    privacy: 'Everything stays on this device. No account, no server, no tracking.',
    export: 'Export data',
    import_: 'Import',
    clear: 'Clear all',
    language: 'Language',
    allclear_title: 'All clear.',
    allclear_body: 'Nothing open right now. Add something, or go enjoy the gap.',
    eyebrow_step: 'Starting with',
    eyebrow_task: 'Just this',
    min: '{n} min',
    min_abbrev: '{n}m',
    start_just: 'Start — just {min} min',
    focus_min: 'Focus {min} min',
    finish_step: 'Finish step ✓',
    mark_done: 'Mark done ✓',
    done: 'Done ✓',
    another_min: 'Another {min} min',
    pause: 'Pause',
    add5: '+5 min',
    resume: 'Resume',
    reset: 'Reset',
    skip_cta: 'Not this right now — show me something else',
    left_count: '{n} left',
    all_steps_done: 'all steps done',
    break_it_down: '✶ Break it down',
    add_step: '+ Add step',
    aria_mark_done: 'Mark "{title}" done',
    aria_pin: 'Pin to top',
    aria_unpin: 'Unpin',
    aria_delete: 'Delete "{title}"',
    aria_step_done: 'Mark step "{title}" done',
    aria_remove_step: 'Remove step',
    prompt_add_step: 'Add a step to "{title}":',
    prompt_minutes: 'About how many minutes? (just a guess)',
    toast_exported: 'Exported. Your data just left in a file you control.',
    confirm_import: 'Replace everything currently here with the imported data?',
    toast_imported: 'Imported.',
    toast_import_fail: 'That file could not be read as Momentum data.',
    confirm_clear: 'Delete all tasks and wins on this device? This cannot be undone.',
    toast_cleared: 'Cleared.',
    toast_skip: 'Okay — moved to the back.',
    toast_timeup: "Time's up. That's a real focus block — log it or keep going.",
    cheers: [
      'Done. That counts.',
      'One down. Momentum.',
      'Nice — that was the hard part.',
      'Logged. Keep the thread going.',
      'That is a win. Take it.',
    ],
  },

  de: {
    title: 'Momentum — eine nächste Sache',
    meta_desc:
      'Momentum macht aus Überforderung eine nächste Handlung. Eine private, offline Fokus-App für ADHS-Köpfe.',
    skip: 'Zur wichtigsten Sache springen',
    stat_today: 'Heute erledigt',
    stat_streak: 'Tagesserie',
    stat_open: 'Offen',
    sec_onething: 'Deine eine Sache gerade jetzt',
    sec_braindump: 'Gedanken-Dump',
    sec_tasks: 'Alles andere',
    sec_wins: 'Erfolge heute',
    capture_ph: 'Was geht dir durch den Kopf? Eine Sache pro Zeile reicht.',
    capture_aria: 'Aufgabe hinzufügen',
    add: 'Hinzufügen',
    hint: 'Erst mal rauslassen. Sortieren kannst du später.',
    tasks_empty: 'Hier ist noch nichts. Füge oben etwas hinzu.',
    wins_empty: 'Heute noch keine Erfolge. Der erste ist der schwerste.',
    privacy: 'Alles bleibt auf diesem Gerät. Kein Konto, kein Server, kein Tracking.',
    export: 'Daten exportieren',
    import_: 'Importieren',
    clear: 'Alles löschen',
    language: 'Sprache',
    allclear_title: 'Alles erledigt.',
    allclear_body: 'Gerade ist nichts offen. Füge etwas hinzu oder genieße die Pause.',
    eyebrow_step: 'Beginne mit',
    eyebrow_task: 'Nur das',
    min: '{n} Min.',
    min_abbrev: '{n} Min.',
    start_just: 'Start — nur {min} Min.',
    focus_min: 'Fokus {min} Min.',
    finish_step: 'Schritt fertig ✓',
    mark_done: 'Als erledigt markieren ✓',
    done: 'Fertig ✓',
    another_min: 'Noch {min} Min.',
    pause: 'Pause',
    add5: '+5 Min.',
    resume: 'Weiter',
    reset: 'Zurücksetzen',
    skip_cta: 'Gerade nicht das — zeig mir etwas anderes',
    left_count: '{n} übrig',
    all_steps_done: 'alle Schritte erledigt',
    break_it_down: '✶ Aufschlüsseln',
    add_step: '+ Schritt hinzufügen',
    aria_mark_done: '"{title}" als erledigt markieren',
    aria_pin: 'Nach oben anheften',
    aria_unpin: 'Lösen',
    aria_delete: '"{title}" löschen',
    aria_step_done: 'Schritt "{title}" als erledigt markieren',
    aria_remove_step: 'Schritt entfernen',
    prompt_add_step: 'Schritt zu "{title}" hinzufügen:',
    prompt_minutes: 'Ungefähr wie viele Minuten? (einfach schätzen)',
    toast_exported: 'Exportiert. Deine Daten liegen jetzt in einer Datei, die du kontrollierst.',
    confirm_import: 'Alles hier durch die importierten Daten ersetzen?',
    toast_imported: 'Importiert.',
    toast_import_fail: 'Diese Datei konnte nicht als Momentum-Daten gelesen werden.',
    confirm_clear:
      'Alle Aufgaben und Erfolge auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.',
    toast_cleared: 'Gelöscht.',
    toast_skip: 'Okay — nach hinten verschoben.',
    toast_timeup: 'Zeit ist um. Das war ein echter Fokusblock — eintragen oder weitermachen.',
    cheers: [
      'Erledigt. Das zählt.',
      'Eins geschafft. Momentum.',
      'Stark — das war der schwere Teil.',
      'Eingetragen. Bleib dran.',
      'Das ist ein Erfolg. Nimm ihn mit.',
    ],
  },

  el: {
    title: 'Momentum — ένα επόμενο βήμα',
    meta_desc:
      'Το Momentum μετατρέπει το άγχος σε ένα επόμενο βήμα. Μια ιδιωτική, offline εφαρμογή συγκέντρωσης για μυαλά με ΔΕΠΥ.',
    skip: 'Μετάβαση στο ένα πράγμα',
    stat_today: 'Έγιναν σήμερα',
    stat_streak: 'Σερί ημερών',
    stat_open: 'Ανοιχτά',
    sec_onething: 'Το ένα σου πράγμα τώρα',
    sec_braindump: 'Άδειασμα μυαλού',
    sec_tasks: 'Όλα τα υπόλοιπα',
    sec_wins: 'Νίκες σήμερα',
    capture_ph: 'Τι σε απασχολεί; Ένα πράγμα ανά γραμμή είναι μια χαρά.',
    capture_aria: 'Προσθήκη εργασίας',
    add: 'Προσθήκη',
    hint: "Βγάλ' το πρώτα από το μυαλό σου. Τακτοποίησέ το μετά.",
    tasks_empty: 'Δεν υπάρχει τίποτα εδώ ακόμα. Πρόσθεσε κάτι παραπάνω.',
    wins_empty: 'Καμία νίκη σήμερα ακόμα. Η πρώτη είναι η πιο δύσκολη.',
    privacy: 'Όλα μένουν σε αυτή τη συσκευή. Χωρίς λογαριασμό, χωρίς διακομιστή, χωρίς παρακολούθηση.',
    export: 'Εξαγωγή δεδομένων',
    import_: 'Εισαγωγή',
    clear: 'Διαγραφή όλων',
    language: 'Γλώσσα',
    allclear_title: 'Όλα καθαρά.',
    allclear_body: 'Τίποτα ανοιχτό τώρα. Πρόσθεσε κάτι ή απόλαυσε το κενό.',
    eyebrow_step: 'Ξεκίνα με',
    eyebrow_task: 'Μόνο αυτό',
    min: '{n} λεπτά',
    min_abbrev: '{n}λ',
    start_just: 'Ξεκίνα — μόλις {min} λεπτά',
    focus_min: 'Εστίαση {min} λεπτά',
    finish_step: 'Ολοκλήρωση βήματος ✓',
    mark_done: 'Σήμανση ως έτοιμο ✓',
    done: 'Έτοιμο ✓',
    another_min: 'Άλλα {min} λεπτά',
    pause: 'Παύση',
    add5: '+5 λεπτά',
    resume: 'Συνέχεια',
    reset: 'Επαναφορά',
    skip_cta: 'Όχι αυτό τώρα — δείξε μου κάτι άλλο',
    left_count: '{n} απομένουν',
    all_steps_done: 'όλα τα βήματα έτοιμα',
    break_it_down: '✶ Ανάλυση σε βήματα',
    add_step: '+ Προσθήκη βήματος',
    aria_mark_done: 'Σήμανση "{title}" ως έτοιμο',
    aria_pin: 'Καρφίτσωμα στην κορυφή',
    aria_unpin: 'Ξεκαρφίτσωμα',
    aria_delete: 'Διαγραφή "{title}"',
    aria_step_done: 'Σήμανση βήματος "{title}" ως έτοιμο',
    aria_remove_step: 'Αφαίρεση βήματος',
    prompt_add_step: 'Πρόσθεσε βήμα στο "{title}":',
    prompt_minutes: 'Περίπου πόσα λεπτά; (απλώς μάντεψε)',
    toast_exported: 'Εξήχθη. Τα δεδομένα σου βρίσκονται τώρα σε ένα αρχείο που ελέγχεις εσύ.',
    confirm_import: 'Να αντικατασταθούν όλα εδώ με τα εισαγόμενα δεδομένα;',
    toast_imported: 'Έγινε εισαγωγή.',
    toast_import_fail: 'Αυτό το αρχείο δεν μπόρεσε να διαβαστεί ως δεδομένα Momentum.',
    confirm_clear: 'Διαγραφή όλων των εργασιών και νικών σε αυτή τη συσκευή; Δεν αναιρείται.',
    toast_cleared: 'Διαγράφηκε.',
    toast_skip: 'Εντάξει — μετακινήθηκε στο τέλος.',
    toast_timeup:
      'Ο χρόνος τελείωσε. Αυτό ήταν πραγματικό μπλοκ συγκέντρωσης — κατάγραψέ το ή συνέχισε.',
    cheers: [
      'Έτοιμο. Μετράει.',
      'Ένα λιγότερο. Momentum.',
      'Ωραία — αυτό ήταν το δύσκολο.',
      'Καταγράφηκε. Κράτα το νήμα.',
      "Αυτό είναι νίκη. Πάρ' την.",
    ],
  },

  fr: {
    title: 'Momentum — une prochaine action',
    meta_desc:
      "Momentum transforme le trop-plein en une prochaine action. Une appli de concentration privée et hors ligne, pensée pour les cerveaux TDAH.",
    skip: 'Aller à la seule chose',
    stat_today: 'Fait aujourd’hui',
    stat_streak: 'Série de jours',
    stat_open: 'En cours',
    sec_onething: 'Ta seule chose maintenant',
    sec_braindump: 'Vide-cerveau',
    sec_tasks: 'Tout le reste',
    sec_wins: 'Victoires du jour',
    capture_ph: 'Qu’est-ce qui te trotte dans la tête ? Une chose par ligne, c’est parfait.',
    capture_aria: 'Ajouter une tâche',
    add: 'Ajouter',
    hint: 'Sors-le d’abord de ta tête. Tu trieras plus tard.',
    tasks_empty: 'Rien ici pour l’instant. Ajoute quelque chose au-dessus.',
    wins_empty: 'Aucune victoire aujourd’hui. La première est la plus dure.',
    privacy: 'Tout reste sur cet appareil. Pas de compte, pas de serveur, pas de suivi.',
    export: 'Exporter les données',
    import_: 'Importer',
    clear: 'Tout effacer',
    language: 'Langue',
    allclear_title: 'Tout est clair.',
    allclear_body: 'Rien en cours pour le moment. Ajoute quelque chose, ou profite de la pause.',
    eyebrow_step: 'Commence par',
    eyebrow_task: 'Juste ça',
    min: '{n} min',
    min_abbrev: '{n} min',
    start_just: 'Démarrer — juste {min} min',
    focus_min: 'Focus {min} min',
    finish_step: 'Terminer l’étape ✓',
    mark_done: 'Marquer comme fait ✓',
    done: 'Fait ✓',
    another_min: 'Encore {min} min',
    pause: 'Pause',
    add5: '+5 min',
    resume: 'Reprendre',
    reset: 'Réinitialiser',
    skip_cta: 'Pas ça maintenant — montre-moi autre chose',
    left_count: '{n} restantes',
    all_steps_done: 'toutes les étapes faites',
    break_it_down: '✶ Découper en étapes',
    add_step: '+ Ajouter une étape',
    aria_mark_done: 'Marquer "{title}" comme fait',
    aria_pin: 'Épingler en haut',
    aria_unpin: 'Désépingler',
    aria_delete: 'Supprimer "{title}"',
    aria_step_done: 'Marquer l’étape "{title}" comme faite',
    aria_remove_step: 'Supprimer l’étape',
    prompt_add_step: 'Ajouter une étape à "{title}" :',
    prompt_minutes: 'Environ combien de minutes ? (juste une estimation)',
    toast_exported: 'Exporté. Tes données sont maintenant dans un fichier que tu contrôles.',
    confirm_import: 'Remplacer tout ce qui est ici par les données importées ?',
    toast_imported: 'Importé.',
    toast_import_fail: 'Ce fichier n’a pas pu être lu comme des données Momentum.',
    confirm_clear: 'Supprimer toutes les tâches et victoires sur cet appareil ? C’est irréversible.',
    toast_cleared: 'Effacé.',
    toast_skip: 'D’accord — déplacé à la fin.',
    toast_timeup: 'Temps écoulé. C’était un vrai bloc de concentration — note-le ou continue.',
    cheers: [
      'Fait. Ça compte.',
      'Un de moins. Momentum.',
      'Bien — c’était le plus dur.',
      'Noté. Garde le fil.',
      'C’est une victoire. Prends-la.',
    ],
  },

  es: {
    title: 'Momentum — una próxima acción',
    meta_desc:
      'Momentum convierte el agobio en una próxima acción. Una app de concentración privada y sin conexión, pensada para mentes con TDAH.',
    skip: 'Ir a la única cosa',
    stat_today: 'Hecho hoy',
    stat_streak: 'Racha de días',
    stat_open: 'Pendientes',
    sec_onething: 'Tu única cosa ahora',
    sec_braindump: 'Vaciado mental',
    sec_tasks: 'Todo lo demás',
    sec_wins: 'Logros de hoy',
    capture_ph: '¿Qué tienes en la cabeza? Una cosa por línea está bien.',
    capture_aria: 'Añadir tarea',
    add: 'Añadir',
    hint: 'Sácalo de tu cabeza primero. Ya lo ordenarás después.',
    tasks_empty: 'Aquí no hay nada todavía. Añade algo arriba.',
    wins_empty: 'Aún no hay logros hoy. El primero es el más difícil.',
    privacy: 'Todo se queda en este dispositivo. Sin cuenta, sin servidor, sin rastreo.',
    export: 'Exportar datos',
    import_: 'Importar',
    clear: 'Borrar todo',
    language: 'Idioma',
    allclear_title: 'Todo despejado.',
    allclear_body: 'Nada pendiente ahora. Añade algo o disfruta del hueco.',
    eyebrow_step: 'Empieza con',
    eyebrow_task: 'Solo esto',
    min: '{n} min',
    min_abbrev: '{n} min',
    start_just: 'Empezar — solo {min} min',
    focus_min: 'Concentración {min} min',
    finish_step: 'Terminar paso ✓',
    mark_done: 'Marcar como hecho ✓',
    done: 'Hecho ✓',
    another_min: 'Otros {min} min',
    pause: 'Pausa',
    add5: '+5 min',
    resume: 'Reanudar',
    reset: 'Reiniciar',
    skip_cta: 'Esto no ahora — muéstrame otra cosa',
    left_count: '{n} restantes',
    all_steps_done: 'todos los pasos hechos',
    break_it_down: '✶ Desglosar',
    add_step: '+ Añadir paso',
    aria_mark_done: 'Marcar "{title}" como hecho',
    aria_pin: 'Fijar arriba',
    aria_unpin: 'Desfijar',
    aria_delete: 'Eliminar "{title}"',
    aria_step_done: 'Marcar el paso "{title}" como hecho',
    aria_remove_step: 'Quitar paso',
    prompt_add_step: 'Añade un paso a "{title}":',
    prompt_minutes: '¿Más o menos cuántos minutos? (solo una estimación)',
    toast_exported: 'Exportado. Tus datos ya están en un archivo que tú controlas.',
    confirm_import: '¿Reemplazar todo lo que hay aquí con los datos importados?',
    toast_imported: 'Importado.',
    toast_import_fail: 'No se pudo leer este archivo como datos de Momentum.',
    confirm_clear: '¿Eliminar todas las tareas y logros de este dispositivo? Esto no se puede deshacer.',
    toast_cleared: 'Borrado.',
    toast_skip: 'Vale — movido al final.',
    toast_timeup: 'Se acabó el tiempo. Eso fue un bloque de concentración de verdad: regístralo o sigue.',
    cheers: [
      'Hecho. Cuenta.',
      'Uno menos. Momentum.',
      'Bien, esa era la parte difícil.',
      'Registrado. Mantén el hilo.',
      'Eso es un logro. Quédatelo.',
    ],
  },
};

// Localized breakdown catalogs (same shape as model.DEFAULT_BREAKDOWNS).
// Non-English regexes skip \b (unreliable around accented/Greek letters) and
// match stems case-insensitively. Order matters: first match wins, default last.
const BREAKDOWNS = {
  en: DEFAULT_BREAKDOWNS,

  de: [
    {
      match: /e-?mail|antwort|nachricht|sms/i,
      steps: [
        { title: 'Öffne den Verlauf und lies ihn einmal', minutes: 2 },
        { title: 'Schreib eine grobe Antwort — egal wie unperfekt', minutes: 5 },
        { title: 'Überfliegen und abschicken', minutes: 3 },
      ],
    },
    {
      match: /schreib|verfass|bericht|aufsatz|essay|blog|artikel|dokument|text/i,
      steps: [
        { title: 'Stichpunkte sammeln, keine ganzen Sätze', minutes: 5 },
        { title: '3 Stichpunkte zu groben Absätzen machen', minutes: 15 },
        { title: 'Einmal lesen, nur das Schlimmste fixen', minutes: 10 },
      ],
    },
    {
      match: /putz|aufräum|wäsche|abwasch|geschirr|zimmer|schreibtisch|küche|saubermach/i,
      steps: [
        { title: 'Stell einen 10-Minuten-Timer, schnapp dir einen Beutel', minutes: 1 },
        { title: 'Nur eine Fläche frei räumen', minutes: 10 },
        { title: '5 Dinge wegräumen, dann aufhören', minutes: 5 },
      ],
    },
    {
      match: /anruf|telefon|termin|arzt|zahnarzt|buch/i,
      steps: [
        { title: 'Nummer suchen und aufschreiben', minutes: 2 },
        { title: 'Den einen Satz notieren, den du sagen musst', minutes: 2 },
        { title: 'Anrufen', minutes: 5 },
      ],
    },
    {
      match: /code|bug|fehler|fix|feature|refactor|deploy|test|programmier/i,
      steps: [
        { title: 'Datei öffnen und die Stelle finden', minutes: 3 },
        { title: 'Die kleinste Änderung machen, die klappen könnte', minutes: 15 },
        { title: 'Einmal ausführen und die Ausgabe lesen', minutes: 5 },
      ],
    },
    {
      steps: [
        { title: 'Vorbereiten — alles öffnen, was du brauchst', minutes: 2 },
        { title: 'Erstes winziges Stück — der kleinste sichtbare Teil', minutes: 5 },
        { title: 'Hauptteil — dranbleiben', minutes: 15 },
        { title: 'Abschließen — prüfen und abschließen', minutes: 5 },
      ],
    },
  ],

  el: [
    {
      match: /email|e-?mail|mail|μήνυμα|απάντησ|απάντηση|απαντ/i,
      steps: [
        { title: 'Άνοιξε τη συνομιλία και διάβασέ την μία φορά', minutes: 2 },
        { title: 'Γράψε μια πρόχειρη απάντηση — ξέχνα το φινίρισμα', minutes: 5 },
        { title: "Τακτοποίησέ το και στείλ' το", minutes: 3 },
      ],
    },
    {
      match: /γράψ|γραφ|έκθεση|άρθρο|αναφορ|κείμενο|blog|post/i,
      steps: [
        { title: 'Ρίξε κουκκίδες, όχι ολόκληρες προτάσεις', minutes: 5 },
        { title: 'Κάνε 3 κουκκίδες πρόχειρες παραγράφους', minutes: 15 },
        { title: 'Διάβασέ το μία φορά, φτιάξε μόνο τα χειρότερα', minutes: 10 },
      ],
    },
    {
      match: /καθάρ|καθαρ|συγύρ|μπουγάδα|πιάτα|δωμάτιο|γραφείο|κουζίνα|σκούπ/i,
      steps: [
        { title: 'Βάλε χρονόμετρο 10 λεπτών, πάρε μια σακούλα', minutes: 1 },
        { title: 'Καθάρισε μόνο μία επιφάνεια', minutes: 10 },
        { title: 'Τακτοποίησε 5 πράγματα και σταμάτα', minutes: 5 },
      ],
    },
    {
      match: /κλήσ|τηλέφων|τηλεφων|ραντεβού|γιατρ|οδοντ|κλείσ/i,
      steps: [
        { title: 'Βρες το νούμερο και σημείωσέ το', minutes: 2 },
        { title: 'Σημείωσε τη μία πρόταση που πρέπει να πεις', minutes: 2 },
        { title: 'Κάνε την κλήση', minutes: 5 },
      ],
    },
    {
      match: /κώδικ|κωδικ|bug|σφάλμα|fix|feature|refactor|deploy|test|προγραμμ/i,
      steps: [
        { title: 'Άνοιξε το αρχείο και βρες πού είναι', minutes: 3 },
        { title: 'Κάνε τη μικρότερη αλλαγή που μπορεί να δουλέψει', minutes: 15 },
        { title: "Τρέξ' το μία φορά και διάβασε το αποτέλεσμα", minutes: 5 },
      ],
    },
    {
      steps: [
        { title: 'Προετοιμασία — άνοιξε ό,τι χρειάζεσαι', minutes: 2 },
        { title: 'Πρώτο μικρό κομμάτι — το πιο μικρό ορατό μέρος', minutes: 5 },
        { title: 'Κυρίως κομμάτι — συνέχισε', minutes: 15 },
        { title: "Ολοκλήρωση — έλεγξε και κλείσ' το", minutes: 5 },
      ],
    },
  ],

  fr: [
    {
      match: /e-?mail|mail|courriel|répond|repond|réponse|message|sms/i,
      steps: [
        { title: 'Ouvre le fil et lis-le une fois', minutes: 2 },
        { title: 'Écris une réponse brute — oublie la perfection', minutes: 5 },
        { title: 'Relis vite et envoie', minutes: 3 },
      ],
    },
    {
      match: /écri|ecri|rédig|redig|texte|rapport|essai|blog|article|document|dissert/i,
      steps: [
        { title: 'Jette des puces, pas de phrases complètes', minutes: 5 },
        { title: 'Transforme 3 puces en paragraphes bruts', minutes: 15 },
        { title: 'Relis une fois, corrige seulement le pire', minutes: 10 },
      ],
    },
    {
      match: /nettoy|range|rangé|lessive|vaisselle|chambre|bureau|cuisine|ménage|menage/i,
      steps: [
        { title: 'Lance un minuteur de 10 min, prends un sac', minutes: 1 },
        { title: 'Dégage une seule surface', minutes: 10 },
        { title: 'Range 5 choses, puis arrête', minutes: 5 },
      ],
    },
    {
      match: /appel|appell|téléphon|telephon|rendez-vous|rdv|médecin|medecin|dentiste|réserv|reserv/i,
      steps: [
        { title: 'Trouve le numéro et note-le', minutes: 2 },
        { title: 'Note la seule phrase à dire', minutes: 2 },
        { title: 'Passe l’appel', minutes: 5 },
      ],
    },
    {
      match: /code|bug|bogue|corrig|fix|fonctionnalité|refactor|déploie|deploie|test|programm/i,
      steps: [
        { title: 'Ouvre le fichier et trouve où ça se passe', minutes: 3 },
        { title: 'Fais le plus petit changement qui pourrait marcher', minutes: 15 },
        { title: 'Lance une fois et lis la sortie', minutes: 5 },
      ],
    },
    {
      steps: [
        { title: 'Préparer — ouvre tout ce qu’il te faut', minutes: 2 },
        { title: 'Premier petit bout — la plus petite partie visible', minutes: 5 },
        { title: 'Gros morceau — continue', minutes: 15 },
        { title: 'Finir — vérifie et clôture', minutes: 5 },
      ],
    },
  ],

  es: [
    {
      match: /e-?mail|correo|mail|responde|respond|respuesta|mensaje|sms/i,
      steps: [
        { title: 'Abre el hilo y léelo una vez', minutes: 2 },
        { title: 'Escribe una respuesta en bruto — olvida pulirla', minutes: 5 },
        { title: 'Repásala y envíala', minutes: 3 },
      ],
    },
    {
      match: /escrib|redact|texto|informe|ensayo|blog|artículo|articulo|documento|redacción/i,
      steps: [
        { title: 'Suelta viñetas, sin frases completas', minutes: 5 },
        { title: 'Convierte 3 viñetas en párrafos en bruto', minutes: 15 },
        { title: 'Léelo una vez, arregla solo lo peor', minutes: 10 },
      ],
    },
    {
      match: /limpi|ordena|orden|ropa|platos|lavar|habitación|habitacion|escritorio|cocina|recog/i,
      steps: [
        { title: 'Pon un temporizador de 10 min y coge una bolsa', minutes: 1 },
        { title: 'Despeja solo una superficie', minutes: 10 },
        { title: 'Guarda 5 cosas y para', minutes: 5 },
      ],
    },
    {
      match: /llama|llamada|teléfono|telefono|cita|médico|medico|dentista|reserv/i,
      steps: [
        { title: 'Busca el número y apúntalo', minutes: 2 },
        { title: 'Anota la única frase que tienes que decir', minutes: 2 },
        { title: 'Haz la llamada', minutes: 5 },
      ],
    },
    {
      match: /código|codigo|bug|error|arregl|fix|función|funcion|refactor|deploy|test|programa/i,
      steps: [
        { title: 'Abre el archivo y encuentra dónde está', minutes: 3 },
        { title: 'Haz el cambio más pequeño que podría funcionar', minutes: 15 },
        { title: 'Ejecútalo una vez y lee la salida', minutes: 5 },
      ],
    },
    {
      steps: [
        { title: 'Preparar — abre todo lo que necesitas', minutes: 2 },
        { title: 'Primer trocito — la parte visible más pequeña', minutes: 5 },
        { title: 'Bloque principal — sigue', minutes: 15 },
        { title: 'Terminar — revisa y cierra', minutes: 5 },
      ],
    },
  ],
};

const SUPPORTED = new Set(LOCALES.map((l) => l.code));
let current = 'en';

export function isSupported(code) {
  return SUPPORTED.has(code);
}

/** Pick a locale: explicit preference first, then the browser's languages. */
export function detectLocale(preferred, navLangs = []) {
  if (preferred && isSupported(preferred)) return preferred;
  for (const l of navLangs) {
    const base = String(l).slice(0, 2).toLowerCase();
    if (isSupported(base)) return base;
  }
  return 'en';
}

export function getLocale() {
  return current;
}

export function setLocale(code) {
  current = isSupported(code) ? code : 'en';
  return current;
}

function interpolate(str, params) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

export function t(key, params) {
  const msg = MESSAGES[current]?.[key] ?? MESSAGES.en[key] ?? key;
  return params ? interpolate(msg, params) : msg;
}

export function cheers() {
  return MESSAGES[current]?.cheers ?? MESSAGES.en.cheers;
}

export function breakdownCatalog() {
  return BREAKDOWNS[current] ?? BREAKDOWNS.en;
}

// Exposed for tests (key/shape parity across locales).
export function _messagesFor(code) {
  return MESSAGES[code];
}
export function _breakdownsFor(code) {
  return BREAKDOWNS[code];
}
