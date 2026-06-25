# PRD: kidash

## Introduction

**kidash** ist ein minimalistisches Dashboard für Selfhoster — eine leichtgewichtige Alternative zu Homarr oder Dashy. Es läuft als einzelner Docker-Container und erhält einen OpenAI API-Key über eine Environment-Variable.

Der User wirft einfach Links oder IP-Adressen aus seinem eigenen Netzwerk in ein Eingabefeld. Das Tool generiert daraus automatisch einen schönen Dashboard-Eintrag: Es holt Metadaten, schlägt ein Icon vor (dreistufige Fallback-Strategie: Favicon → Icon-Library → KI-generiert), gruppiert den Eintrag mit verwandten Einträgen und baut so ein sauberes, übersichtliches Dashboard auf.

## Goals

- Single-Container Docker-Setup (ein Befehl zum Starten)
- Ein Eingabefeld: URL oder IP einwerfen → fertig strukturierter Eintrag
- Automatische Icon-Auflösung via 3-Stufen-Fallback (Favicon → Simple Icons → KI)
- Automatische Gruppierung/Kategorisierung der Einträge via KI
- Schönes, klares Dashboard-UI mit gruppierten Kacheln
- Single-User Auth via ENV-Token (kein Login-System)
- Persistenz via SQLite (dateibasiert, kein zweiter Container nötig)

## Tech-Stack

- **Framework:** Next.js (Fullstack: React + API Routes)
- **Datenbank:** SQLite (via Prisma oder better-sqlite3)
- **KI:** OpenAI API (Modell konfigurierbar, Default: gpt-4o-mini)
- **Icons:** Simple Icons (selfhosted/svg), Favicon-Fetch, KI-Fallback
- **Auth:** Bearer-Token via ENV (`AUTH_TOKEN`)
- **Container:** Single Docker image (multi-stage build)

## User Stories

### US-001: Projekt-Setup und Docker-Grundgerüst
**Description:** Als Developer brauche ich ein lauffähiges Next.js-Projekt mit Docker-Setup, sodass ich und andere das mit einem Befehl starten können.

**Acceptance Criteria:**
- [ ] Next.js-Projekt (App Router) initialisiert mit TypeScript
- [ ] `Dockerfile` (multi-stage: deps → build → runner) vorhanden
- [ ] `docker-compose.yml` mit Volume für SQLite und ENV-Variablen
- [ ] `.env.example` dokumentiert: `OPENAI_API_KEY`, `AUTH_TOKEN`, `DATABASE_PATH`, `OPENAI_MODEL`
- [ ] `npm run dev` startet Next.js erfolgreich auf `localhost:3000`
- [ ] `npm run lint` und `npm run typecheck` ohne Fehler
- [ ] README mit Start-Anleitung (1 Befehl zum Run)

### US-002: Datenbank-Schema und Persistenz
**Description:** Als Developer brauche ich eine SQLite-Anbindung und ein Schema für Dashboard-Einträge, sodass Daten den Container-Neustart überleben.

**Acceptance Criteria:**
- [ ] SQLite via Prisma (oder better-sqlite3) integriert
- [ ] `Entry`-Modell mit Feldern: `id`, `url`, `title`, `description`, `categoryId`, `iconUrl`, `iconType` (`favicon` | `library` | `ai`), `color`, `order` (int, für Sortierung innerhalb Kategorie), `createdAt`, `updatedAt`
- [ ] `Category`-Modell mit Feldern: `id`, `name`, `slug`, `order` (int, für Sortierung der Kategorien), `createdAt`, `updatedAt`
- [ ] Relation: `Entry.categoryId → Category.id` (1:n)
- [ ] Migration läuft beim ersten Start automatisch (Volume-mount unter `/data`)
- [ ] DB-Datei liegt unter konfigurierbarem Pfad (Default `/data/kidash.db`)
- [ ] Typecheck und Lint ohne Fehler

### US-003: Auth-Middleware (Single-User Token)
**Description:** Als Selfhoster will ich mein Dashboard per Token schützen, sodass nicht jeder in meinem Netzwerk Einträge anlegen kann.

**Acceptance Criteria:**
- [ ] Proxy prüft `Authorization: Bearer <token>` oder Cookie auf **allen** API-Routes
- [ ] Proxy leitet nicht-authentifizierte Seiten-Besuche auf `/login` weiter
- [ ] Token wird aus `AUTH_TOKEN` ENV gelesen
- [ ] Login-Seite (`/login`) akzeptiert Token-Eingabe, setzt Cookie (`kidash_auth`, HttpOnly, 30 Tage)
- [ ] Nach Login: Weiterleitung auf Dashboard `/`
- [ ] Ungültiger/Fehlender Token bei API → `401 Unauthorized`
- [ ] Wenn `AUTH_TOKEN` nicht gesetzt → klare Fehlermeldung im Serverlog beim Start
- [ ] Typecheck und Lint ohne Fehler

### US-004: Link-Eingabe und Parsing-API
**Description:** Als User will ich eine URL oder IP in ein Eingabefeld werfen, sodass das System daraus einen strukturierten Eintrag macht.

**Acceptance Criteria:**
- [ ] `POST /api/entries` akzeptiert `{ url: string }` (URL oder IP, mit/ohne Port/Protokoll)
- [ ] Backend normalisiert Eingabe (ergänzt `http://` falls fehlt, akzeptiert IPs wie `192.168.1.5:8080`)
- [ ] Backend versucht, die Seite zu fetchen und `<title>`, Meta-Description und Favicon-Links zu extrahieren
- [ ] Wenn Fetch fehlschlägt (z.B. IP nicht erreichbar) → trotzdem Eintrag mit URL als Title
- [ ] Response enthält den erstellten Eintrag mit allen Feldern
- [ ] Typecheck und Lint ohne Fehler

### US-005: Icon-Auflösung Stage 1 — Favicon
**Description:** Als User will ich, dass das Tool automatisch das Favicon der Zielseite verwendet, sodass ich Icons nicht manuell suchen muss.

**Acceptance Criteria:**
- [ ] Beim Anlegen eines Eintrags: Versuche Favicon aus HTML `<link rel="icon">` zu extrahieren
- [ ] Fallback auf `/favicon.ico` der Ziel-URL
- [ ] Fallback auf Google Favicon Service (`https://www.google.com/s2/favicons?domain=...`) als Proxy-Lösung
- [ ] Bei Erfolg: `iconType = "favicon"`, `iconUrl` gesetzt
- [ ] Bei Misserfolg: weiter zu US-006 (Icon-Library)
- [ ] Typecheck und Lint ohne Fehler

### US-006: Icon-Auflösung Stage 2 — Simple Icons Library
**Description:** Als User will ich hochwertige Marken-Icons sehen, wenn der Dienst bekannt ist (z.B. Nextcloud, Plex, Home Assistant).

**Acceptance Criteria:**
- [ ] Simple Icons SVGs selfgehostet im Repo (oder via `simple-icons` npm package)
- [ ] Mapping-Logik: normalized service name → simple-icons slug
- [ ] Aufruf erfolgt nur, wenn Stage 1 (Favicon) kein Ergebnis lieferte
- [ ] Bei Treffer: `iconType = "library"`, `iconUrl` zeigt auf SVG (lokal gespeichert unter `/public/icons/`)
- [ ] Bei keinem Treffer: weiter zu US-007 (KI-Generierung)
- [ ] Typecheck und Lint ohne Fehler

### US-007: Icon-Auflösung Stage 3 — KI-Fallback
**Description:** Als User will ich auch für obskure Selfhosted-Dienste ein passendes Icon sehen, auch wenn keine Library das kennt.

**Acceptance Criteria:**
- [ ] Wird nur aufgerufen, wenn Stage 1 und 2 keinen Treffer lieferten
- [ ] Prompt an OpenAI: generiere ein passendes Icon (SVG) basierend auf Service-Name/Beschreibung
- [ ] Generiertes SVG wird validiert und lokal gespeichert unter `/public/icons/ai/<id>.svg`
- [ ] `iconType = "ai"`, `iconUrl` gesetzt
- [ ] Bei KI-Fehler: generisches Fallback-Icon (glob mit Initialen)
- [ ] Typecheck und Lint ohne Fehler

### US-008: KI-Anreicherung (Name, Kategorie, Beschreibung)
**Description:** Als User will ich, dass die KI Titel, Beschreibung und Kategorie automatisch erkennt, sodass mein Dashboard sauber gruppiert ist.

**Acceptance Criteria:**
- [ ] OpenAI-Call mit System-Prompt: analysiere URL + gecrawlte Metadaten
- [ ] Liefert strukturiertes JSON: `{ title, description, category, color }`
- [ ] `category` ist ein kurzer Slug (z.B. `media`, `network`, `automation`, `storage`)
- [ ] Wenn Fetch der Seite fehlschlug → KI bekommt nur URL und leitet daraus Kategorie ab
- [ ] Prompt ist im Code als Konstante hinterlegt und leicht anpassbar
- [ ] OpenAI-Fehler → graceful degradation (URL als Title, `category = "other"`)
- [ ] Typecheck und Lint ohne Fehler

### US-009: Dashboard-UI mit Gruppierung
**Description:** Als User will ich ein schönes Dashboard sehen, auf dem meine Einträge nach Kategorien gruppiert sind.

**Acceptance Criteria:**
- [ ] Hauptseite `/` lädt alle Einträge via `GET /api/entries`
- [ ] Einträge werden nach `category` gruppiert als Sektionen angezeigt
- [ ] Jede Sektion hat Überschrift (Kategorie-Name) und Kachel-Grid
- [ ] Kachel zeigt Icon, Titel, Beschreibung (gekürzt), verlinkt bei Klick auf URL
- [ ] Leeres Dashboard zeigt freundlichen Empty-State mit Hinweis auf Eingabefeld
- [ ] Responsiv: 1 Spalte mobil, bis 4 Spalten Desktop
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-010: Eingabefeld im Dashboard
**Description:** Als User will ich oben im Dashboard ein Eingabefeld sehen, um neue Einträge schnell hinzuzufügen.

**Acceptance Criteria:**
- [ ] Eingabefeld (Input + Button) oben auf der Dashboard-Seite
- [ ] Beim Submit: `POST /api/entries` mit der eingegebenen URL
- [ ] Loading-State während KI/Fetch läuft (kann 2–5 Sekunden dauern)
- [ ] Bei Erfolg: neue Kachel erscheint in passender Kategorie (mit Animation)
- [ ] Bei Fehler: Toast-Notification mit verständlicher Meldung
- [ ] Eingabefeld leert sich nach Erfolg
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-011: Einträge bearbeiten und löschen
**Description:** Als User will ich bestehende Einträge bearbeiten oder löschen, falls die KI etwas falsch erkannt hat.

**Acceptance Criteria:**
- [ ] `PATCH /api/entries/:id` aktualisiert Titel/Beschreibung/Kategorie/URL
- [ ] `DELETE /api/entries/:id` löscht den Eintrag
- [ ] Kachel hat "Bearbeiten" und "Löschen" Aktionen (Hover-Menu oder Kontext-Klick)
- [ ] Bearbeiten öffnet Modal mit vorausgefüllten Feldern
- [ ] Löschen fragt kurz nach ("Wirklich löschen?")
- [ ] Nach Aktion: Dashboard updated sich ohne Page-Reload
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-012: Kategorien umbenennen
**Description:** Als User will ich Kategorien umbenennen, falls die KI einen unpassenden Namen gewählt hat oder ich meine eigene Struktur bevorzuge.

**Acceptance Criteria:**
- [ ] Sektions-Überschrift per Klick editierbar (Inline-Edit)
- [ ] Enter speichert, Esc bricht ab
- [ ] Umbenannte Kategorie wird in DB persistiert (eigene `Category`-Tabelle mit `name` und `order`)
- [ ] Beim Anlegen eines neuen Eintrags: KI schlägt Kategorie vor, wird aber auf bestehende Kategorie gematcht, falls der Slug ähnlich ist
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-013: Kacheln per Drag-and-Drop umsortieren
**Description:** Als User will ich Kacheln innerhalb einer Kategorie per Drag-and-Drop umsortieren, damit ich meine wichtigsten Dienste oben sehe.

**Acceptance Criteria:**
- [ ] Drag-and-Drop via `@dnd-kit/core` + `@dnd-kit/sortable` (modern, barrierearm)
- [ ] Kacheln sind innerhalb einer Kategorie sortierbar
- [ ] Visuelles Feedback beim Draggen (Ghost-Element, Drop-Indikator)
- [ ] Neue Reihenfolge wird sofort in DB persistiert (`order`-Feld am Entry)
- [ ] Nach Page-Reload bleibt die Sortierung erhalten
- [ ] Sortierung kann parallel in mehreren Kategorien stattfinden (unabhängig voneinander)
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-014: Kacheln zwischen Kategorien verschieben
**Description:** Als User will ich eine Kachel von einer Kategorie in eine andere ziehen, falls die KI sie falsch einsortiert hat.

**Acceptance Criteria:**
- [ ] Drag-and-Drop über Kategorie-Grenzen hinweg (Cross-Container-DnD mit `@dnd-kit`)
- [ ] Ziel-Kategorie wird visuell hervorgehoben, wenn eine Kachel darüber schwebt
- [ ] Beim Drop: `category`-Feld des Entry wird aktualisiert + `order` an neuer Position eingesetzt
- [ ] Quell-Kategorie rückt restliche Kacheln auf, Ziel-Kategorie macht Platz
- [ ] Persistenz in DB erfolgt sofort nach Drop
- [ ] Kachel kann auch auf leere Kategorie gezogen werden
- [ ] Kachel kann auf "Unkategorisiert"-Bereich gezogen werden (falls Kategorie gelöscht wird)
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

### US-015: Kategorien sortieren
**Description:** Als User will ich die Reihenfolge der Kategorien selbst bestimmen, damit meine wichtigsten Kategorien oben stehen.

**Acceptance Criteria:**
- [ ] Sektions-Überschriften (Kategorie-Köpfe) per Drag-and-Drop verschiebbar
- [ ] Visueller Indikator beim Draggen der ganzen Sektion
- [ ] Neue Reihenfolge wird in DB persistiert (`order`-Feld an `Category`-Tabelle)
- [ ] Nach Page-Reload bleibt die Reihenfolge erhalten
- [ ] Leere Kategorien werden standardmäßig ans Ende sortiert (konfigurierbar)
- [ ] Typecheck und Lint ohne Fehler
- [ ] Im Browser verifizieren (dev-browser)

## Functional Requirements

- **FR-1:** Das System startet mit `docker compose up` und ist unter Port 3000 erreichbar
- **FR-2:** Die ENV-Variablen `OPENAI_API_KEY`, `AUTH_TOKEN`, `DATABASE_PATH`, `OPENAI_MODEL` werden ausgewertet
- **FR-3:** `POST /api/entries` mit `{ url }` erstellt einen vollständigen Eintrag mit KI-Anreicherung und Icon
- **FR-4:** Icon-Auflösung läuft in der Reihenfolge: Favicon → Simple Icons → KI-generiert
- **FR-5:** Jeder Eintrag hat eindeutige Felder: id, url, title, description, categoryId, iconUrl, iconType, color, order
- **FR-6:** `GET /api/entries` liefert alle Einträge gruppiert nach Kategorie (Token erforderlich)
- **FR-7:** Alle API-Routes erfordern Bearer-Token (inkl. GET)
- **FR-8:** Das Dashboard rendert Kategorien als Sektionen mit Kacheln
- **FR-9:** Eintrag-Erstellung ist asynchron mit Lade-Indikator (läuft 2–5s)
- **FR-10:** Beim Start ohne `OPENAI_API_KEY` → klare Fehlermeldung, App läuft nicht
- **FR-11:** Kacheln sind per Drag-and-Drop innerhalb einer Kategorie umsortierbar
- **FR-12:** Kacheln sind per Drag-and-Drop zwischen Kategorien verschiebbar (Cross-Container-DnD)
- **FR-13:** Kategorien sind per Drag-and-Drop umsortierbar
- **FR-14:** Alle Sortier- und Verschiebe-Aktionen werden sofort in der DB persistiert (`order`-Felder)
- **FR-15:** Sortierung bleibt über Page-Reloads und Container-Neustarts erhalten

## Non-Goals (Out of Scope)

- **Kein Multi-User** — Single-User-Tool, ein Token reicht
- **Keine komplexen Widgets** — keine Live-Statistiken, kein Embedding von Inhalten (wie Homarr es bietet)
- **Kein SSO/OIDC** — Token via ENV genügt
- **Kein integrierter Crawler** — nur einmaliger Fetch beim Anlegen, kein Reindex
- **Kein Theme-System** — erst mal ein sauberes Dark-Theme, später evtl. konfigurierbar
- **Keine Multi-Tab/Seiten-Konzept** — ein einzelnes Dashboard, keine Sub-Pages
- **Keine öffentliche Icon-API** — Icons liegen lokal, keine externen Abhängigkeiten zur Laufzeit (außer Favicon-Fetch von Ziel-URL und Google-Favicon-Fallback)

## Design Considerations

- **Theme:** Dark-Mode-first, clean und modern (Inspiration: Homarr, Dashy, Portainer)
- **Farben:** neutrale Basis (zinc/slate), KI-generierte Akzentfarbe pro Kategorie
- **Kacheln:** gerundet, leichter Hover-Effekt, Icon + Titel + Kurzbeschreibung
- **Typography:** sans-serif, klare Hierarchie
- **Keine UI-Library-Zwang** — Tailwind CSS reicht (oder shadcn/ui für einzelne Komponenten)
- **Icons:** quadratisch, einheitliche Größe (z.B. 48×48px), SVG bevorzugt

## Technical Considerations

- **Next.js App Router** (nicht Pages Router) — moderner Standard
- **SQLite + Prisma** für typsichere DB-Zugriffe und einfache Migration
- **OpenAI SDK** (`openai` npm package), Modell via ENV (`OPENAI_MODEL`, Default `gpt-4o-mini`)
- **Favicon-Fetch:** Node `fetch` + simple HTML-Parser (`cheerio` oder regex für `<link rel="icon">`)
- **Simple Icons:** `simple-icons` npm package oder lokale Kopie der relevanten SVGs
- **KI-Icon-Generierung:** OpenAI-Chat mit SVG-Output, Validierung dass Output valides SVG ist
- **Drag-and-Drop:** `@dnd-kit/core` + `@dnd-kit/sortable` — modern, barrierearm, unterstützt Multi-Container (innerhalb + zwischen Kategorien) und Sortable-Listen für Kategorie-Sortierung. Alternative: `react-beautiful-dnd` (veraltet, nicht empfohlen)
- **Optimistic Updates:** DnD-Änderungen sofort im UI sichtbar, DB-Save im Hintergrund; bei Fehler Rollback + Toast
- **Sortier-Logik:** `order`-Feld (integer) am Entry und an der Category. Beim Drop: Reihenfolge der betroffenen Kategorie(n) neu indizieren, um Lücken zu vermeiden
- **Docker:** Node Alpine-Base, nicht-root-User, `/data` Volume für SQLite
- **Rate-Limiting:** OpenAI-Calls sind teuer — bei Fehlern graceful degradation, keine Endlos-Retries

## Success Metrics

- Dashboard startet mit einem `docker compose up` (nur API-Key und Token als ENV nötig)
- Neuer Eintrag aus URL/IP in < 5 Sekunden sichtbar
- > 80% der Einträge haben ein sinnvolles Icon (Favicon oder Library-Treffer)
- Dashboard sieht auch mit 20+ Einträgen aufgeräumt aus (Gruppierung funktioniert)
- Kein externer Dienst außer OpenAI und der Ziel-URL selbst nötig

## Open Questions

- **Icon-Caching:** Sollen Favicons lokal gespeichert werden (und beim Neu-Import aktualisiert)? → Erstmal Hotlink, später Caching-Story
- **Kategorie-Verwaltung:** Sollen User eigene Kategorien anlegen können, oder nur die von der KI vorgeschlagenen? → Vorschlag: KI schlägt vor, User kann umbenennen/zusammenlegen
- **OpenAI-Modell:** Ist `gpt-4o-mini` ausreichend für Icon-Generierung als SVG, oder brauchen wir `gpt-4o`? → Im Prototyp testen
- **Reindex:** Was passiert, wenn sich eine Ziel-URL ändert? → Out of scope für v1
