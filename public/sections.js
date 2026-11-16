/* Baukasten-Definition: welche Abschnitte es gibt, welche Felder sie haben,
   Schriften, Farbvorlagen und Umwandlung alter Inhalte. Wird von Website und Editor genutzt. */
(function () {
  var K = {};

  // ---------- Schriften (alle von Google Fonts) ----------
  K.FONTS = {
    display: [
      { name: 'Archivo', spec: 'Archivo:wdth,wght@62..125,300..900', fb: '"Arial Narrow",Arial,sans-serif', stretch: true },
      { name: 'Anton', spec: 'Anton', fb: 'Impact,sans-serif' },
      { name: 'Bebas Neue', spec: 'Bebas+Neue', fb: 'Impact,sans-serif' },
      { name: 'Oswald', spec: 'Oswald:wght@300..700', fb: '"Arial Narrow",sans-serif' },
      { name: 'Big Shoulders Display', spec: 'Big+Shoulders+Display:wght@300..900', fb: '"Arial Narrow",sans-serif' },
      { name: 'Space Grotesk', spec: 'Space+Grotesk:wght@300..700', fb: 'system-ui,sans-serif' },
      { name: 'Syne', spec: 'Syne:wght@400..800', fb: 'system-ui,sans-serif' },
      { name: 'Unbounded', spec: 'Unbounded:wght@300..900', fb: 'system-ui,sans-serif' },
      { name: 'Inter Tight', spec: 'Inter+Tight:wght@300..900', fb: 'system-ui,sans-serif' },
      { name: 'Playfair Display', spec: 'Playfair+Display:wght@400..900', fb: 'Georgia,serif' },
      { name: 'DM Serif Display', spec: 'DM+Serif+Display', fb: 'Georgia,serif' },
      { name: 'Fraunces', spec: 'Fraunces:wght@300..900', fb: 'Georgia,serif' }
    ],
    body: [
      { name: 'IBM Plex Sans', spec: 'IBM+Plex+Sans:wght@400;500;600', fb: 'system-ui,sans-serif' },
      { name: 'Inter', spec: 'Inter:wght@400;500;600', fb: 'system-ui,sans-serif' },
      { name: 'DM Sans', spec: 'DM+Sans:wght@400;500;600', fb: 'system-ui,sans-serif' },
      { name: 'Manrope', spec: 'Manrope:wght@400;500;600', fb: 'system-ui,sans-serif' },
      { name: 'Work Sans', spec: 'Work+Sans:wght@400;500;600', fb: 'system-ui,sans-serif' },
      { name: 'Lora', spec: 'Lora:wght@400;500;600', fb: 'Georgia,serif' },
      { name: 'Source Serif 4', spec: 'Source+Serif+4:wght@400;500;600', fb: 'Georgia,serif' }
    ],
    mono: [
      { name: 'IBM Plex Mono', spec: 'IBM+Plex+Mono:wght@400;500', fb: 'ui-monospace,Menlo,monospace' },
      { name: 'JetBrains Mono', spec: 'JetBrains+Mono:wght@400;500', fb: 'ui-monospace,Menlo,monospace' },
      { name: 'Space Mono', spec: 'Space+Mono:wght@400;700', fb: 'ui-monospace,Menlo,monospace' },
      { name: 'DM Mono', spec: 'DM+Mono:wght@400;500', fb: 'ui-monospace,Menlo,monospace' }
    ]
  };
  K.font = function (role, name) {
    var list = K.FONTS[role];
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return list[0];
  };
  // Schriften liegen lokal im Ordner fonts/ (keine Verbindung zu Google)
  K.fontSlug = function (name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  K.fontCss = function (role, name) { return 'fonts/' + K.fontSlug(K.font(role, name).name) + '.css'; };

  // ---------- Farbvorlagen ----------
  K.PRESETS = {
    'Signature Rot': { bg: '#0e1113', panel: '#151a1d', line: '#283034', fg: '#ebe7e0', muted: '#8f999d', accent: '#d6363d' },
    'Tungsten':      { bg: '#0f1214', panel: '#171c1f', line: '#2a3236', fg: '#e9e6df', muted: '#8e989c', accent: '#f2a33a' },
    'Teal & Orange': { bg: '#0b1416', panel: '#122023', line: '#1f3337', fg: '#e8f0ef', muted: '#86a3a3', accent: '#ff7a3d' },
    'Nachtblau':     { bg: '#0b0f1a', panel: '#121829', line: '#222b42', fg: '#e6e9f2', muted: '#8b93ab', accent: '#5b8cff' },
    'Papier':        { bg: '#f4f2ee', panel: '#ebe8e2', line: '#d6d1c8', fg: '#151515', muted: '#6c6a66', accent: '#c8262d' },
    'Weiß & Schwarz':{ bg: '#ffffff', panel: '#f3f3f3', line: '#e2e2e2', fg: '#0b0b0b', muted: '#6b6b6b', accent: '#0b0b0b' }
  };

  K.DEFAULT_THEME = {
    bg: '#0e1113', panel: '#151a1d', line: '#283034', fg: '#ebe7e0', muted: '#8f999d', accent: '#d6363d',
    fontDisplay: 'Archivo', fontBody: 'IBM Plex Sans', fontMono: 'IBM Plex Mono',
    headingUpper: true, headingWeight: 800, headingStretch: 68, headingScale: 100,
    baseSize: 16, radius: 0, maxWidth: 1240, grain: true, motion: true,
    anim: 'up', animSpeed: 'm', photoHover: 'zoom', collapsible: true
  };

  // ---------- Gemeinsame Felder: Aussehen, Animation, Menü ----------
  K.ANIMS = [['none', 'Keine'], ['fade', 'Einblenden'], ['up', 'Von unten'], ['down', 'Von oben'], ['left', 'Von links'], ['right', 'Von rechts'], ['zoom', 'Heranzoomen'], ['blur', 'Aus der Unschärfe'], ['reveal', 'Vorhang (wie ein Wipe)']];
  K.LOOK = [
    { k: 'background', t: 'choice', l: 'Hintergrund', o: [['default', 'Standard'], ['panel', 'Fläche'], ['accent', 'Akzent-Ton'], ['inverted', 'Umgekehrt']] },
    { k: 'spacing', t: 'choice', l: 'Abstand oben/unten', o: [['s', 'Klein'], ['m', 'Mittel'], ['l', 'Groß']] },
    { k: 'align', t: 'choice', l: 'Ausrichtung', o: [['left', 'Links'], ['center', 'Mitte']] },
    { k: 'divider', t: 'toggle', l: 'Trennlinie oben' },
    { k: 'collapsible', t: 'choice', l: 'Einklappbar (Pfeil an der Überschrift)', o: [['auto', 'Wie im Design'], ['yes', 'Ja'], ['no', 'Nein']], help: 'Gilt für Abschnitte mit großer Überschrift. Beim Laden ist immer alles ausgeklappt.' }
  ];
  K.ANIM = [
    { k: 'anim', t: 'select', l: 'Wie erscheint der Abschnitt beim Scrollen?', o: [['auto', 'Wie im Design eingestellt']].concat(K.ANIMS) },
    { k: 'animStagger', t: 'toggle', l: 'Elemente nacheinander einblenden (z. B. Fotos einzeln)' },
    { k: 'animSpeed', t: 'choice', l: 'Tempo', o: [['auto', 'Standard'], ['s', 'Schnell'], ['m', 'Normal'], ['l', 'Langsam']] }
  ];
  K.MENU = [
    { k: 'navLabel', t: 'text', l: 'Name im Menü', ph: 'leer = nicht im Menü', help: 'Steht oben in der Navigation und springt zu diesem Abschnitt.' }
  ];
  K.LAYOUT = K.LOOK.concat(K.MENU);

  var FILM_FIELDS = [
    { k: 'youtube', t: 'youtube', l: 'YouTube-Link' },
    { k: 'title', t: 'text', l: 'Titel' },
    { k: 'subtitle', t: 'text', l: 'Untertitel / Künstler' },
    { k: 'kind', t: 'text', l: 'Art', ph: 'z. B. Kurzfilm', adv: true },
    { k: 'date', t: 'text', l: 'Datum', ph: 'z. B. Mai 2026' },
    { k: 'badge', t: 'text', l: 'Etikett auf dem Bild', adv: true },
    { k: 'roles', t: 'tags', l: 'Meine Rolle (mit Komma trennen)' },
    { k: 'text', t: 'textarea', l: 'Beschreibung' },
    { k: 'crew', t: 'text', l: 'Team', adv: true },
    { k: 'image', t: 'image', l: 'Standbild', help: 'Ohne Standbild wird das YouTube-Vorschaubild genutzt.' },
    { k: 'video', t: 'video', l: 'Oder eigene Videodatei', adv: true },
    { k: '_vis', t: 'vis' }
  ];

  // ---------- Abschnittstypen ----------
  K.TYPES = {
    hero: {
      label: 'Startbereich', desc: 'Großer Kasten oben mit Showreel, Überschrift und Buttons',
      fields: [
        { k: 'image', t: 'image', l: 'Hintergrundbild' },
        { k: 'youtube', t: 'youtube', l: 'Showreel (YouTube-Link)' },
        { k: 'video', t: 'video', l: 'Oder Showreel als Videodatei', adv: true },
        { k: 'playLabel', t: 'text', l: 'Text auf dem Play-Button', adv: true },
        { k: 'ratio', t: 'choice', l: 'Format des Kastens', o: [['2.39/1', 'Kino'], ['21/9', '21:9'], ['16/9', '16:9'], ['3/2', '3:2']], adv: true },
        { k: 'viewfinder', t: 'toggle', l: 'Kamera-Sucher (REC, Timecode)', adv: true },
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'highlight', t: 'text', l: 'Hervorgehobenes Wort (in Akzentfarbe)' },
        { k: 'text', t: 'textarea', l: 'Text' },
        { k: 'button1', t: 'button', l: 'Button 1' },
        { k: 'button2', t: 'button', l: 'Button 2' },
        { k: 'facts', t: 'tags', l: 'Info-Zeile (mit Komma trennen)', adv: true }
      ],
      defaults: { image: '', youtube: '', video: '', playLabel: 'Showreel ansehen', ratio: '2.39/1', viewfinder: true, title: 'Bilder, die', highlight: 'bleiben.', text: '', button1: { label: 'Projekt anfragen', link: '#kontakt' }, button2: { label: 'Filme ansehen', link: '#filme' }, facts: [], spacing: 's', divider: false }
    },
    films: {
      label: 'Filme', desc: 'Liste von Filmen mit YouTube-Player oder eigenem Video',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'intro', t: 'textarea', l: 'Einleitung' },
        { k: 'layout', t: 'choice', l: 'Anordnung', o: [['alternating', 'Abwechselnd'], ['grid', '2 Spalten'], ['grid3', '3 Spalten'], ['stack', 'Untereinander']] },
        { k: 'items', t: 'items', l: 'Filme', item: 'Film', titleKey: 'title', fields: FILM_FIELDS, newItem: { title: 'Neuer Film', subtitle: '', kind: '', date: '', badge: '', text: '', roles: [], crew: '', youtube: '', video: '', image: '' } }
      ],
      defaults: { title: 'Filme', intro: '', layout: 'alternating', items: [], navLabel: 'Filme' }
    },
    video: {
      label: 'Einzelnes Video', desc: 'Ein großes Video, z. B. ein Showreel oder Trailer',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'text', t: 'textarea', l: 'Text' },
        { k: 'youtube', t: 'youtube', l: 'YouTube-Link' },
        { k: 'video', t: 'video', l: 'Oder Videodatei' },
        { k: 'image', t: 'image', l: 'Standbild (optional)' },
        { k: 'ratio', t: 'choice', l: 'Format', o: [['16/9', '16:9'], ['2.39/1', 'Kino'], ['9/16', '9:16'], ['1/1', '1:1']] }
      ],
      defaults: { title: 'Showreel', text: '', youtube: '', video: '', image: '', ratio: '16/9' }
    },
    photos: {
      label: 'Fotografie', desc: 'Fotoserien als Raster, mit Großansicht',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'intro', t: 'textarea', l: 'Einleitung' },
        { k: 'columns', t: 'range', l: 'Spalten', min: 2, max: 5 },
        { k: 'ratio', t: 'choice', l: 'Bildformat', o: [['4/5', '4:5'], ['1/1', '1:1'], ['3/2', '3:2'], ['auto', 'Mauerwerk']] },
        { k: 'gap', t: 'range', l: 'Abstand zwischen Bildern', min: 0, max: 32, unit: 'px', adv: true },
        { k: 'limit', t: 'range', l: 'Fotos pro Serie, danach Button „Alle ansehen“ (0 = alle zeigen)', min: 0, max: 24 },
        { k: 'items', t: 'items', l: 'Serien', item: 'Serie', titleKey: 'title', fields: [
          { k: 'title', t: 'text', l: 'Titel der Serie' },
          { k: 'text', t: 'textarea', l: 'Text' },
          { k: 'photos', t: 'photos', l: 'Fotos' },
          { k: '_vis', t: 'vis' }
        ], newItem: { title: 'Neue Serie', text: '', photos: [] } }
      ],
      defaults: { title: 'Fotografie', intro: '', columns: 4, ratio: '4/5', gap: 10, limit: 8, items: [], navLabel: 'Fotografie' }
    },
    text: {
      label: 'Text', desc: 'Überschrift und Fließtext',
      fields: [
        { k: 'eyebrow', t: 'text', l: 'Kleine Zeile darüber' },
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'body', t: 'textarea', l: 'Text', help: 'Leerzeile = neuer Absatz' },
        { k: 'size', t: 'choice', l: 'Textgröße', o: [['m', 'Normal'], ['l', 'Groß'], ['xl', 'Sehr groß']] },
        { k: 'button1', t: 'button', l: 'Button' }
      ],
      defaults: { eyebrow: '', title: 'Neue Überschrift', body: 'Dein Text.', size: 'm', button1: { label: '', link: '' } }
    },
    textImage: {
      label: 'Text mit Bild', desc: 'Bild neben Text, Seite wählbar',
      fields: [
        { k: 'image', t: 'image', l: 'Bild' },
        { k: 'imageSide', t: 'choice', l: 'Bild-Seite', o: [['left', 'Links'], ['right', 'Rechts']] },
        { k: 'imageRatio', t: 'choice', l: 'Bildformat', o: [['4/5', '4:5'], ['1/1', '1:1'], ['16/9', '16:9'], ['auto', 'Original']], adv: true },
        { k: 'caption', t: 'text', l: 'Bildunterschrift', adv: true },
        { k: 'eyebrow', t: 'text', l: 'Kleine Zeile darüber', adv: true },
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'body', t: 'textarea', l: 'Text', help: 'Leerzeile = neuer Absatz' },
        { k: 'facts', t: 'items', l: 'Fakten-Liste', item: 'Fakt', titleKey: 'label', fields: [{ k: 'label', t: 'text', l: 'Bezeichnung' }, { k: 'value', t: 'text', l: 'Wert' }], newItem: { label: 'Neu', value: '' }, adv: true },
        { k: 'button1', t: 'button', l: 'Button', adv: true }
      ],
      defaults: { image: '', imageSide: 'left', imageRatio: '4/5', caption: '', eyebrow: '', title: 'Überschrift', body: 'Dein Text.', facts: [], button1: { label: '', link: '' } }
    },
    services: {
      label: 'Leistungen', desc: 'Kacheln mit Titel, Text und Schlagworten',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'intro', t: 'text', l: 'Kleine Zeile rechts' },
        { k: 'columns', t: 'range', l: 'Spalten', min: 1, max: 4 },
        { k: 'items', t: 'items', l: 'Leistungen', item: 'Leistung', titleKey: 'title', fields: [
          { k: 'label', t: 'text', l: 'Kleine Zeile' }, { k: 'title', t: 'text', l: 'Titel' },
          { k: 'text', t: 'textarea', l: 'Text' }, { k: 'tags', t: 'tags', l: 'Schlagworte (mit Komma trennen)' }
        ], newItem: { label: '', title: 'Neue Leistung', text: '', tags: [] } }
      ],
      defaults: { title: 'Leistungen', intro: '', columns: 3, items: [], navLabel: 'Leistungen' }
    },
    steps: {
      label: 'Ablauf / Schritte', desc: 'Nummerierte Schritte nebeneinander',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'intro', t: 'text', l: 'Kleine Zeile rechts' },
        { k: 'items', t: 'items', l: 'Schritte', item: 'Schritt', titleKey: 'title', fields: [
          { k: 'label', t: 'text', l: 'Kleine Zeile' }, { k: 'title', t: 'text', l: 'Titel' }, { k: 'text', t: 'textarea', l: 'Text' }
        ], newItem: { label: '', title: 'Neuer Schritt', text: '' } }
      ],
      defaults: { title: 'So arbeiten wir zusammen', intro: '', items: [] }
    },
    quote: {
      label: 'Zitat', desc: 'Großes Zitat, z. B. Kundenstimme',
      fields: [{ k: 'text', t: 'textarea', l: 'Zitat' }, { k: 'author', t: 'text', l: 'Von wem' }],
      defaults: { text: 'Ein Satz, der hängen bleibt.', author: '', align: 'center' }
    },
    cta: {
      label: 'Aufruf-Banner', desc: 'Auffälliges Banner mit Button',
      fields: [{ k: 'title', t: 'text', l: 'Überschrift' }, { k: 'text', t: 'textarea', l: 'Text' }, { k: 'button1', t: 'button', l: 'Button' }],
      defaults: { title: 'Lust auf ein Projekt?', text: '', button1: { label: 'Jetzt anfragen', link: '#kontakt' }, background: 'accent', align: 'center' }
    },
    logos: {
      label: 'Kunden / Partner', desc: 'Reihe mit Namen oder Logos',
      fields: [
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'items', t: 'items', l: 'Einträge', item: 'Eintrag', titleKey: 'name', fields: [
          { k: 'name', t: 'text', l: 'Name' }, { k: 'image', t: 'image', l: 'Logo (optional)' }, { k: 'link', t: 'text', l: 'Link (optional)' }
        ], newItem: { name: 'Neuer Name', image: '', link: '' } }
      ],
      defaults: { title: 'Gearbeitet mit', items: [], align: 'center' }
    },
    contact: {
      label: 'Kontakt', desc: 'E-Mail mit Kopieren-Button, Social Links, Hinweise',
      fields: [
        { k: 'eyebrow', t: 'text', l: 'Kleine Zeile darüber' },
        { k: 'title', t: 'text', l: 'Überschrift' },
        { k: 'highlight', t: 'text', l: 'Hervorgehobenes Wort' },
        { k: 'email', t: 'text', l: 'E-Mail-Adresse' },
        { k: 'phone', t: 'text', l: 'Telefon (optional)', adv: true },
        { k: 'links', t: 'items', l: 'Links', item: 'Link', titleKey: 'label', fields: [{ k: 'label', t: 'text', l: 'Beschriftung', plain: true }, { k: 'url', t: 'text', l: 'Adresse' }, { k: 'style', t: 'choice', l: 'Stil', o: [['outline', 'Umrandet'], ['primary', 'Gefüllt'], ['text', 'Nur Text →']] }, { k: 'color', t: 'color', l: 'Farbe' }], newItem: { label: 'Neuer Link', url: 'https://', style: 'outline', color: '' } },
        { k: 'form', t: 'toggle', l: 'Kontaktformular anzeigen', defTrue: true, refresh: true },
        { k: 'formTitle', t: 'text', l: 'Überschrift über dem Formular', plain: true, when: { form: true } },
        { k: 'formTypes', t: 'lines', l: 'Auswahl „Was für ein Projekt?“ (eine Zeile pro Option)', adv: true },
        { k: 'formBudgets', t: 'lines', l: 'Auswahl „Budget“ (eine Zeile pro Option, leer = Feld ausblenden)', adv: true },
        { k: 'formSuccess', t: 'text', l: 'Text nach dem Absenden', plain: true, adv: true },
        { k: 'listTitle', t: 'text', l: 'Überschrift der Liste', adv: true },
        { k: 'list', t: 'lines', l: 'Liste (eine Zeile pro Punkt)', adv: true }
      ],
      defaults: { eyebrow: '', title: 'Lass uns', highlight: 'drehen.', email: '', phone: '', links: [], listTitle: '', list: [], navLabel: 'Kontakt', form: true, formTitle: 'Erzähl mir von deinem Projekt', formTypes: ['Musikvideo', 'Kurzfilm', 'Imagefilm / Werbung', 'Event', 'Social Content', 'Fotografie', 'Etwas anderes'], formBudgets: ['unter 1.000 €', '1.000 – 3.000 €', '3.000 – 7.000 €', 'über 7.000 €', 'Weiß ich noch nicht'], formSuccess: 'Danke! Deine Anfrage ist angekommen. Ich melde mich in der Regel innerhalb von 1–2 Tagen.' }
    },
    spacer: {
      label: 'Abstand / Linie', desc: 'Leerraum oder Trennlinie',
      fields: [{ k: 'height', t: 'range', l: 'Höhe', min: 0, max: 200 }, { k: 'line', t: 'toggle', l: 'Linie anzeigen' }],
      defaults: { height: 48, line: true, spacing: 's' }
    },
    free: {
      label: 'Freier Bereich', desc: 'Eigene Kombination aus Überschriften, Text, Buttons, Bildern, Videos …',
      fields: [
        { k: 'elements', t: 'elements', l: 'Elemente' },
        { k: 'valign', t: 'choice', l: 'Elemente nebeneinander ausrichten', o: [['start', 'Oben'], ['center', 'Mittig'], ['end', 'Unten']] }
      ],
      defaults: { elements: [], valign: 'start' }
    }
  };


  // ---------- Elemente für den freien Bereich ----------
  var W = { k: 'width', t: 'choice', l: 'Breite', o: [['full', 'Ganz'], ['twothird', '2/3'], ['half', '1/2'], ['third', '1/3']] };
  var AL = { k: 'align', t: 'choice', l: 'Ausrichtung', o: [['left', 'Links'], ['center', 'Mitte'], ['right', 'Rechts']] };
  K.ELEMENTS = {
    heading: { label: 'Überschrift', icon: 'H', fields: [{ k: 'text', t: 'text', l: 'Text' }, { k: 'highlight', t: 'text', l: 'Hervorgehoben (Akzentfarbe)', ph: 'optional' }, { k: 'size', t: 'choice', l: 'Größe', o: [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']] }, AL, W], d: { text: 'Neue Überschrift', highlight: '', size: 'l' } },
    eyebrow: { label: 'Kleine Zeile', icon: '—', fields: [{ k: 'text', t: 'text', l: 'Text' }, { k: 'accent', t: 'toggle', l: 'In Akzentfarbe' }, AL, W], d: { text: 'Kleine Zeile', accent: true } },
    text: { label: 'Text', icon: '¶', fields: [{ k: 'title', t: 'text', l: 'Überschrift (optional)' }, { k: 'text', t: 'textarea', l: 'Text', help: 'Leerzeile = neuer Absatz' }, { k: 'size', t: 'choice', l: 'Größe', o: [['s', 'Klein'], ['m', 'Normal'], ['l', 'Groß'], ['xl', 'Sehr groß']] }, { k: 'muted', t: 'toggle', l: 'Gedämpfte Farbe' }, AL, W], d: { text: 'Dein Text.', size: 'm' } },
    buttons: { label: 'Buttons', icon: '▭', fields: [{ k: 'items', t: 'items', l: 'Buttons', item: 'Button', titleKey: 'label', fields: [
      { k: 'label', t: 'text', l: 'Beschriftung', plain: true }, { k: '_act', t: 'btnaction', l: 'Was passiert beim Klick?' },
      { k: 'style', t: 'choice', l: 'Stil', o: [['primary', 'Gefüllt'], ['outline', 'Umrandet'], ['text', 'Nur Text →']] },
      { k: 'size', t: 'choice', l: 'Größe', o: [['s', 'Klein'], ['m', 'Normal'], ['l', 'Groß']] },
      { k: 'color', t: 'color', l: 'Farbe' }
    ], newItem: { label: 'Neuer Button', action: 'section', value: 'kontakt', style: 'outline', size: 'm', color: '' } }, AL, W], d: { items: [{ label: 'Projekt anfragen', action: 'section', value: 'kontakt', style: 'primary', size: 'm' }] } },
    image: { label: 'Bild', icon: '◧', fields: [{ k: 'src', t: 'image', l: 'Bild' }, { k: 'ratio', t: 'choice', l: 'Format', o: [['auto', 'Original'], ['16/9', '16:9'], ['4/5', '4:5'], ['1/1', '1:1']] }, { k: 'caption', t: 'text', l: 'Bildunterschrift' }, { k: 'link', t: 'link', l: 'Beim Klick öffnen (optional)', adv: true }, { k: 'zoom', t: 'toggle', l: 'Beim Klick groß anzeigen', adv: true }, W], d: { src: '', ratio: 'auto', caption: '', link: '', zoom: true } },
    video: { label: 'Video', icon: '▶', fields: [{ k: 'youtube', t: 'youtube', l: 'YouTube-Link' }, { k: 'video', t: 'video', l: 'Oder Videodatei', adv: true }, { k: 'image', t: 'image', l: 'Standbild (optional)', adv: true }, { k: 'ratio', t: 'choice', l: 'Format', o: [['16/9', '16:9'], ['2.39/1', 'Kino'], ['9/16', '9:16'], ['1/1', '1:1']] }, { k: 'caption', t: 'text', l: 'Bildunterschrift' }, W], d: { youtube: '', video: '', image: '', ratio: '16/9', caption: '' } },
    gallery: { label: 'Bildergalerie', icon: '▦', fields: [{ k: 'photos', t: 'photos', l: 'Fotos' }, { k: 'columns', t: 'range', l: 'Spalten', min: 1, max: 6 }, { k: 'ratio', t: 'choice', l: 'Format', o: [['4/5', '4:5'], ['1/1', '1:1'], ['3/2', '3:2'], ['auto', 'Mauerwerk']] }, { k: 'limit', t: 'range', l: 'Danach „Alle ansehen“ (0 = alle zeigen)', min: 0, max: 24 }, W], d: { photos: [], columns: 3, ratio: '1/1', limit: 9 } },
    stats: { label: 'Zahlen', icon: '#', fields: [{ k: 'items', t: 'items', l: 'Zahlen', item: 'Zahl', titleKey: 'value', fields: [{ k: 'value', t: 'text', l: 'Zahl', ph: 'z. B. 40+' }, { k: 'label', t: 'text', l: 'Beschriftung' }], newItem: { value: '10+', label: 'Beschriftung' } }, { k: 'count', t: 'toggle', l: 'Hochzählen beim Einblenden' }, AL, W], d: { items: [{ value: '20+', label: 'Projekte' }, { value: '4', label: 'Kurzfilme' }, { value: '3', label: 'Jahre Erfahrung' }], count: true } },
    list: { label: 'Liste', icon: '•', fields: [{ k: 'items', t: 'lines', l: 'Punkte (eine Zeile pro Punkt)' }, { k: 'style', t: 'choice', l: 'Stil', o: [['dot', '●'], ['check', '✓'], ['num', '1.'], ['dash', '—']] }, W], d: { items: ['Erster Punkt', 'Zweiter Punkt'], style: 'check' } },
    quote: { label: 'Zitat', icon: '„', fields: [{ k: 'text', t: 'textarea', l: 'Zitat' }, { k: 'author', t: 'text', l: 'Von wem' }, AL, W], d: { text: 'Ein Satz, der hängen bleibt.', author: '' } },
    spacer: { label: 'Abstand', icon: '↕', fields: [{ k: 'height', t: 'range', l: 'Höhe', min: 8, max: 200, unit: 'px' }], d: { height: 48 } },
    project: { label: 'Projekt-Steckbrief', icon: '▤', fields: [
      { k: 'status', t: 'choice', l: 'Stand', o: [['nda', 'Unter NDA'], ['post', 'In Postproduktion'], ['prod', 'In Produktion'], ['soon', 'Release folgt']] },
      { k: 'title', t: 'text', l: 'Titel', ph: 'z. B. Musikvideo für ein Major-Label' },
      { k: 'client', t: 'text', l: 'Kunde (darf auch allgemein sein)', ph: 'z. B. Internationales Sportlabel', plain: true },
      { k: 'kind', t: 'text', l: 'Art' },
      { k: 'date', t: 'text', l: 'Zeitraum', ph: 'z. B. 2026' },
      { k: 'text', t: 'textarea', l: 'Worum ging es?' },
      { k: 'roles', t: 'tags', l: 'Meine Rolle (mit Komma trennen)' },
      { k: 'tasks', t: 'lines', l: 'Was ich gemacht habe (eine Zeile pro Punkt)' },
      { k: 'stats', t: 'items', l: 'Zahlen', item: 'Zahl', titleKey: 'value', fields: [{ k: 'value', t: 'text', l: 'Zahl', ph: 'z. B. 3' }, { k: 'label', t: 'text', l: 'Beschriftung', ph: 'z. B. Drehtage' }], newItem: { value: '1', label: 'Beschriftung' } },
      { k: 'tools', t: 'tags', l: 'Technik & Software (mit Komma trennen)' },
      { k: 'visual', t: 'choice', l: 'Bild', o: [['none', 'Kein Bild'], ['image', 'Erlaubtes Foto'], ['tile', 'Platzhalter-Kachel']], refresh: true, adv: true },
      { k: 'image', t: 'image', l: 'Foto (z. B. erlaubtes Setfoto)', when: { visual: 'image' }, adv: true },
      { k: 'note', t: 'text', l: 'Text auf der Kachel', ph: 'z. B. Vertraulich', when: { visual: 'tile' }, plain: true, adv: true },
      { k: 'button', t: 'button', l: 'Button (optional)', adv: true },
      W
    ], d: { status: 'nda', title: 'Musikvideo für ein Major-Label', client: 'Internationales Musiklabel', kind: 'Musikvideo', date: '2026', text: 'Kurze Beschreibung des Projekts, ohne vertrauliche Details.', roles: ['Regie', 'Kamera', 'Schnitt'], tasks: ['Konzept und Shotlist', 'Dreh mit 2 Kameras', 'Schnitt und Color Grading'], stats: [{ value: '2', label: 'Drehtage' }, { value: '8', label: 'Personen im Team' }], tools: ['Sony FX6', 'DaVinci Resolve'], visual: 'none', image: '', note: '', button: { label: '', link: '' } } },
    divider: { label: 'Linie', icon: '―', fields: [{ k: 'accent', t: 'toggle', l: 'In Akzentfarbe' }], d: { accent: false } }
  };
  K.newElement = function (type) {
    var e = JSON.parse(JSON.stringify(K.ELEMENTS[type].d));
    e.type = type; e.eid = K.uid();
    if (!e.width) e.width = 'full';
    if (!e.align) e.align = 'left';
    return e;
  };

  // ---------- Schnell einfügen: fertige Kombinationen ----------
  K.QUICK = [
    { label: 'Überschrift + Text', icon: 'H¶', els: [['heading', { text: 'Überschrift', size: 'l' }], ['text', { text: 'Hier steht dein Text.' }]] },
    { label: 'Buttons', icon: '▭▭', els: [['buttons', { items: [{ label: 'Projekt anfragen', link: '#kontakt', style: 'primary', size: 'm' }, { label: 'Showreel ansehen', link: '#', style: 'outline', size: 'm' }] }]] },
    { label: 'Bild', icon: '◧', els: [['image', {}]] },
    { label: 'Bildergalerie', icon: '▦', els: [['gallery', {}]] },
    { label: 'Video', icon: '▶', els: [['video', {}]] },
    { label: 'Zahlen', icon: '#', els: [['stats', {}]] },
    { label: 'Bild + Text nebeneinander', icon: '◧¶', valign: 'center', els: [['image', { width: 'half', ratio: '4/5' }], ['text', { title: 'Überschrift', text: 'Text neben dem Bild.', width: 'half', size: 'l' }]] },
    { label: 'Projekt ohne Video (NDA)', icon: '▤', els: [['project', {}]] },
    { label: 'Leerer Bereich', icon: '+', els: [] }
  ];
  K.quickSection = function (q) {
    var s = K.newSection('free');
    if (q.valign) s.valign = q.valign;
    s.elements = q.els.map(function (x) { var e = K.newElement(x[0]); for (var k in x[1]) e[k] = x[1][k]; return e; });
    return s;
  };

  // Felder, die formatiert werden können (Farbe, Größe, fett …)
  K.RICH = { title: 1, text: 1, body: 1, intro: 1, highlight: 1, subtitle: 1, eyebrow: 1, caption: 1, author: 1, crew: 1, kind: 1, label: 1, listTitle: 1 };
  K.isRich = function (f) { return (f.t === 'text' || f.t === 'textarea') && K.RICH[f.k] && !f.plain; };


  // ---------- Sichtbarkeit (gleiche Logik wie auf dem Server in lib/visibility.js) ----------
  K.today = function () { try { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  K.publicView = function (data, codes) {
    codes = codes || [];
    var t = K.today(), out = JSON.parse(JSON.stringify(data || {})), locked = false, unlocked = 0;
    function ok(code) { var c = String(code || '').trim().toLowerCase(); return !!c && codes.some(function (x) { return String(x || '').trim().toLowerCase() === c; }); }
    function item(it) {
      if (!it || typeof it !== 'object') return it;
      if (it.publishAt && it.publishAt > t) return null;
      if (it.visibility === 'code') {
        locked = true;
        if (ok(it.code)) { delete it.code; it.unlocked = true; unlocked++; return it; }
        if (it.teaser === false) return null;
        return { locked: true, title: it.title || '', subtitle: it.subtitle || '', kind: it.kind || '', date: it.date || '', badge: it.badge || '' };
      }
      if (it.visibility === 'nda') { delete it.youtube; delete it.video; delete it.image; delete it.photos; it.nda = true; }
      delete it.code;
      return it;
    }
    if (Array.isArray(out.sections)) out.sections = out.sections.filter(function (s) {
      if (s.publishAt && s.publishAt > t) return false;
      if (s.visibility === 'code') { locked = true; if (!ok(s.code)) return false; unlocked++; s.unlocked = true; }
      delete s.code;
      if (Array.isArray(s.items)) s.items = s.items.map(item).filter(Boolean);
      return true;
    });
    out.hasLocked = locked;
    return { view: out, unlocked: unlocked };
  };
  K.VIS_ITEM = [
    { k: 'visibility', t: 'choice', l: 'Wer sieht das?', o: [['public', 'Alle'], ['nda', 'NDA-Kachel'], ['code', 'Nur mit Code']], refresh: true },
    { k: 'ndaNote', t: 'text', l: 'Text auf der NDA-Kachel', ph: 'Vertraulich · Release folgt', when: { visibility: 'nda' }, plain: true, help: 'Bilder und Videos werden Besuchern nicht geschickt, nur Titel und Text.' },
    { k: 'code', t: 'code', l: 'Zugangscode', when: { visibility: 'code' } },
    { k: 'teaser', t: 'toggle', l: 'Gesperrte Kachel mit Titel zeigen (sonst ganz unsichtbar)', when: { visibility: 'code' }, defTrue: true },
    { k: 'publishAt', t: 'date', l: 'Erst sichtbar ab (optional)', help: 'Bis zu diesem Tag sehen Besucher den Eintrag nicht. Du siehst ihn im Editor.' }
  ];
  K.VIS_SEC = [
    { k: 'visibility', t: 'choice', l: 'Wer sieht diesen Abschnitt?', o: [['public', 'Alle'], ['code', 'Nur mit Code']], refresh: true },
    { k: 'code', t: 'code', l: 'Zugangscode', when: { visibility: 'code' } },
    { k: 'publishAt', t: 'date', l: 'Erst sichtbar ab (optional)' }
  ];


  // ---------- Was ein Button tut ----------
  K.BTN_ACTIONS = [['section', 'Zu einem Abschnitt springen'], ['url', 'Webseite öffnen'], ['mail', 'E-Mail schreiben'], ['phone', 'Anrufen'], ['copy', 'Text kopieren (z. B. E-Mail-Adresse)'], ['showreel', 'Showreel abspielen'], ['file', 'Datei herunterladen (PDF, Bild)'], ['code', 'Kundenzugang öffnen']];
  K.btnAction = function (b) {
    b = b || {};
    if (b.action) return { a: b.action, v: b.value || '' };
    var l = String(b.link != null ? b.link : (b.url || '')).trim();
    if (!l || l === '#') return { a: 'none', v: '' };
    if (l[0] === '#') return { a: 'section', v: l.slice(1) };
    if (/^mailto:/i.test(l)) return { a: 'mail', v: l.slice(7) };
    if (/^tel:/i.test(l)) return { a: 'phone', v: l.slice(4) };
    return { a: 'url', v: l };
  };
  K.btnSummary = function (b, data) {
    var x = K.btnAction(b), v = x.v;
    function secName(id) { var s = ((data || {}).sections || []).filter(function (s) { return K.anchor(s) === id; })[0]; if (!s) return null; var n = s.navLabel || ((s.title || '') + (s.highlight ? ' ' + s.highlight : '')) || K.TYPES[s.type].label; return window.RT ? RT.plain(n) : n; }
    switch (x.a) {
      case 'section': var n = secName(v); return n ? 'Springt zu „' + n + '“' : 'Springt zu einem Abschnitt, der nicht mehr existiert. Bitte neu wählen.';
      case 'url': return v ? 'Öffnet ' + v.replace(/^https?:\/\//, '') + ' in einem neuen Tab' : 'Öffnet eine Webseite (Adresse fehlt noch)';
      case 'mail': return v ? 'Öffnet das E-Mail-Programm an ' + v : 'E-Mail (Adresse fehlt noch)';
      case 'phone': return v ? 'Ruft ' + v + ' an (auf dem Handy)' : 'Anrufen (Nummer fehlt noch)';
      case 'copy': return v ? 'Kopiert „' + v + '“, der Button zeigt kurz „Kopiert ✓“' : 'Kopieren (Text fehlt noch)';
      case 'showreel': return 'Spielt das Showreel aus dem Startbereich ab';
      case 'file': return v ? 'Lädt die Datei herunter' : 'Datei herunterladen (Datei fehlt noch)';
      case 'code': return 'Öffnet das Fenster „Kundenzugang“ für Zugangscodes';
      default: return 'Macht noch nichts. Wähle eine Aktion.';
    }
  };

  K.uid = function () { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  K.slug = function (s) {
    return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };
  K.anchor = function (s) { return K.slug(s.navLabel) || s.id; };
  K.newSection = function (type) {
    var d = JSON.parse(JSON.stringify(K.TYPES[type].defaults));
    var base = { id: K.uid(), type: type, visible: true, navLabel: '', background: 'default', spacing: 'm', align: 'left', divider: true, anim: 'auto', animStagger: true, animSpeed: 'auto', elements: [] };
    for (var k in d) base[k] = d[k];
    return base;
  };

  // ---------- Inhalte vereinheitlichen (alte Version 1 → Baukasten) ----------
  K.normalize = function (d) {
    d = d || {};
    if (!Array.isArray(d.sections)) d = K.migrateV1(d);
    d.version = 2;
    d.theme = Object.assign({}, K.DEFAULT_THEME, d.theme || {});
    d.site = Object.assign({ name: 'Janosch Rajewski', title: '', city: '', shareImage: '', description: '', footer: '', ctaLabel: 'Anfragen', ctaTarget: 'kontakt' }, d.site || {});
    d.sections.forEach(function (s) {
      var t = K.TYPES[s.type];
      if (!t) return;
      var fresh = K.newSection(s.type);
      for (var k in fresh) if (s[k] === undefined) s[k] = fresh[k];
      if (!s.id) s.id = K.uid();
    });
    d.sections = d.sections.filter(function (s) { return K.TYPES[s.type]; });
    return d;
  };

  K.migrateV1 = function (v) {
    var sr = v.showreel || {}, ab = v.about || {};
    function sec(type, props) { var s = K.newSection(type); for (var k in props) s[k] = props[k]; return s; }
    return {
      version: 2,
      sections: [
        sec('hero', { image: sr.heroImage || '', youtube: sr.youtube || '', video: sr.video || '' }),
        sec('films', { items: v.films || [] }),
        sec('photos', { items: v.series || [] }),
        sec('textImage', { image: ab.image || '', caption: ab.caption || '', title: 'Hinter der Kamera', navLabel: 'Über mich' }),
        sec('contact', { email: 'janosch.rajewski@gmail.com' })
      ]
    };
  };

  window.Kit = K;
})();
