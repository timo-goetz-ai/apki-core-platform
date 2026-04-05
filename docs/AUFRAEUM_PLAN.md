# Mac Aufräum-Plan & Ordnerstruktur
## Stand: 12. März 2026

---

## BEREITS ERLEDIGT ✅

| Aktion | Ergebnis |
|--------|---------|
| `node_modules` in `02_PROJECTS/agents-next-js/` gelöscht | **421 MB frei** |
| `node_modules` in `06_SYSTEM/` gelöscht | **92 MB frei** |
| `.next` Build-Caches gelöscht | **~6 MB frei** |
| `.venv` in `02_PROJECTS/agents-next-js/` gelöscht | frei |
| `__pycache__` überall entfernt | frei |
| `.DS_Store` Dateien entfernt | frei |
| Kaputten `.cursorrules` Symlink entfernt | Fehler behoben |
| **Alles in `~/Projects/01_Active_Projects/aios/` konsolidiert + GitHub gepusht** | System konsolidiert |

---

## AKTUELLE ORDNER-SITUATION

```
~/
├── aios/                    ✅ BEHALTEN – das neue Monorepo (Git-verwaltet)
├── _AIOS_MIGRATION_OUTPUT/  🗑️  LÖSCHEN – alles ist in aios/
├── canvas/                  🗑️  LÖSCHEN – ist in aios/docs/visuals/
├── 00_UNSORTED/             🗑️  LÖSCHEN – leer / unwichtige Fragmente
├── 01_AI/                   📦 ARCHIVIEREN – alles ist in aios/ migriert
├── 02_PROJECTS/             📦 ARCHIVIEREN – alles ist in aios/ migriert
│   └── foundgrounding/      ➜  VERSCHIEBEN nach ~/03_BUSINESS/projekte/
├── 03_BUSINESS/
│   ├── bewerbung/           ✅ BEHALTEN – iCloud (persönliche Dokumente)
│   ├── zertifikate/         ✅ BEHALTEN – iCloud (Zertifikate)
│   ├── recherchen/          ✅ BEHALTEN – iCloud
│   ├── STUDIO/              📦 ARCHIVIEREN – alles in aios/ migriert
│   │   └── crew-ai-generator/  (in aios/agents/ vorhanden)
│   │   └── 03_AI_Engineering/  (in aios/infrastructure/ vorhanden)
│   └── ARCHIV/              🗜️  KOMPRIMIEREN – 2.1GB historisches Archiv
├── 04_NOTES/                ✅ BEHALTEN – persönliche Notizen (iCloud)
├── 05_FILES/                ✅ BEHALTEN – persönliche Dateien (iCloud)
├── 06_SYSTEM/               🧹 AUFRÄUMEN – Installer entfernen
├── Groundfunding/           ➜  VERSCHIEBEN nach ~/03_BUSINESS/projekte/groundfunding/
├── Desktop/
│   └── Schreibtisch – iMac von Timo/  ⚠️  CLOUD-SYNC PROBLEM – 2.1 GB
├── Documents/               ✅ BEHALTEN – iCloud
└── Downloads/               🧹 AUFRÄUMEN – regelmäßig leeren
```

---

## PHASE 1 – SOFORT (sicher, 10 Minuten)

### 1.1 `_AIOS_MIGRATION_OUTPUT/` löschen
```bash
rm -rf ~/._AIOS_MIGRATION_OUTPUT
```
> Alles davon ist in `~/Projects/01_Active_Projects/aios/` vorhanden. 184 KB gespart.

### 1.2 `canvas/` löschen
```bash
rm -rf ~/canvas
```
> Die HTML-Datei ist in `~/Projects/01_Active_Projects/aios/docs/visuals/` vorhanden.

### 1.3 `00_UNSORTED/` löschen
```bash
rm -rf ~/00_UNSORTED
```
> Enthält nur leere Ordner und unwichtige Text-Fragmente.

### 1.4 `06_SYSTEM/` aufräumen (Installer entfernen)
```bash
# Keyboard Maestro Installer (228 MB ZIP) löschen wenn nicht mehr benötigt:
rm ~/06_SYSTEM/installers/keyboardmaestro-1104.zip
```

---

## PHASE 2 – NACH BESTÄTIGUNG (Quelldaten archivieren)

> ⚠️ Erst bestätigen, dass alles in `aios/` korrekt vorhanden ist!

### 2.1 `01_AI/` und `02_PROJECTS/` archivieren

**Option A – Komprimieren (empfohlen):**
```bash
# Komprimiertes Archiv erstellen
cd ~
tar -czf ~/05_FILES/ARCHIV_01_AI_$(date +%Y%m%d).tar.gz 01_AI/
tar -czf ~/05_FILES/ARCHIV_02_PROJECTS_$(date +%Y%m%d).tar.gz 02_PROJECTS/

# Erst nach Überprüfung: Originale löschen
rm -rf ~/01_AI ~/02_PROJECTS
```

**Option B – In Archiv-Ordner verschieben:**
```bash
mkdir -p ~/ARCHIV_ALT
mv ~/01_AI ~/ARCHIV_ALT/
mv ~/02_PROJECTS ~/ARCHIV_ALT/
```

### 2.2 `03_BUSINESS/STUDIO/` archivieren
```bash
tar -czf ~/05_FILES/ARCHIV_03_BUSINESS_STUDIO_$(date +%Y%m%d).tar.gz 03_BUSINESS/STUDIO/
rm -rf ~/03_BUSINESS/STUDIO
```

### 2.3 `03_BUSINESS/ARCHIV/` komprimieren (2.1 GB → ca. 500 MB)
```bash
tar -czf ~/05_FILES/ARCHIV_03_BUSINESS_ARCHIV_$(date +%Y%m%d).tar.gz 03_BUSINESS/ARCHIV/
rm -rf ~/03_BUSINESS/ARCHIV
```

### 2.4 `Groundfunding/` verschieben
```bash
mkdir -p ~/03_BUSINESS/projekte
mv ~/Groundfunding ~/03_BUSINESS/projekte/groundfunding
```

---

## PHASE 3 – iCLOUD SYNC PROBLEM LÖSEN

### Das Problem
`Desktop/Schreibtisch – iMac von Timo/` = **2.1 GB**
Das ist die iCloud Desktop-Spiegelung von deinem alten iMac.
Dieser Ordner synchronisiert sich bei jeder Änderung – verbraucht iCloud-Speicher und verlangsamt den Mac.

### Lösung A – Empfohlen: iCloud Desktop-Sync deaktivieren
```
1. Systemeinstellungen → Apple ID / iCloud
2. iCloud Drive → Optionen
3. Haken bei "Desktop & Dokumente" ENTFERNEN
→ Dadurch wird Desktop NICHT mehr in iCloud gespeichert
→ Die Ordner bleiben lokal auf dem Mac
```

### Lösung B – iMac-Schreibtisch-Sync aufräumen
```
1. Ordner "Schreibtisch – iMac von Timo" in ~/05_FILES/ARCHIV_IMAC/ verschieben
2. Nicht mehr benötigte Dateien darin löschen
3. Wichtige Projekte bereits in ~/Projects/01_Active_Projects/aios/ vorhanden
```

### Was im iMac-Desktop zu behalten wäre:
- `01_Command_Center/03_Agents/` (Agent-Definitionen – großteils in aios/)
- `04_Knowledge/` (Wissensbasis – ggf. für NotebookLM wichtig)
- `03_AI_Engineering/` (weitgehend in aios/ vorhanden)

### Was gelöscht werden kann:
- `99_Archive/` (echtes Archiv, nicht mehr aktuell)
- `02_Business/` (Duplikat von ~/03_BUSINESS/)
- `05_Private/` (auf iMac belassen, nicht mehr lokal nötig)

---

## PHASE 4 – NEUE ZIELSTRUKTUR (danach)

```
~/
├── aios/                    → Gesamter Tech-Stack (Git + GitHub)
├── 03_BUSINESS/             → iCloud ✅
│   ├── bewerbung/           → Bewerbungs-Unterlagen
│   ├── zertifikate/         → DEKRA, WBS Zertifikat
│   ├── recherchen/          → Marktrecherchen
│   └── projekte/            → Aktive Projekte (Groundfunding etc.)
├── 04_NOTES/                → iCloud ✅ Persönliche Notizen
├── 05_FILES/                → iCloud ✅ Persönliche Dateien + Archiv-ZIPs
├── Documents/               → iCloud ✅ Standard-Dokumente
├── Downloads/               → Lokal (regelmäßig leeren)
└── Desktop/                 → NUR aktuelle Dateien (kein iCloud-Sync)
```

---

## ERWARTETE SPEICHER-EINSPARUNG

| Maßnahme | Einsparung |
|----------|-----------|
| node_modules / .next / .venv (bereits erledigt) | ~520 MB |
| `01_AI/` archivieren + löschen | ~400 KB |
| `02_PROJECTS/` archivieren + löschen (nach Komprimierung) | ~400 MB |
| `03_BUSINESS/STUDIO/` archivieren + löschen | ~450 MB |
| `03_BUSINESS/ARCHIV/` komprimieren (2.1GB → ~500MB) | ~1.6 GB |
| `_AIOS_MIGRATION_OUTPUT/` löschen | ~184 KB |
| `canvas/` löschen | ~44 KB |
| `00_UNSORTED/` löschen | ~1.2 MB |
| **TOTAL** | **~3 GB** |

---

## NÄCHSTE SCHRITTE FÜR DICH

1. **Sage: "Phase 1 ausführen"** → Ich lösche sofort `_AIOS_MIGRATION_OUTPUT`, `canvas`, `00_UNSORTED`
2. **Prüfe `~/Projects/01_Active_Projects/aios/`** → Stelle sicher, dass alles da ist was du brauchst
3. **Sage: "Phase 2 ausführen"** → Ich archiviere `01_AI`, `02_PROJECTS`, `03_BUSINESS/STUDIO`
4. **iCloud-Sync** → Das machst du manuell in den Systemeinstellungen (Anleitung oben)

---

*Erstellt: 12. März 2026 | Alle kritischen Daten gesichert in ~/Projects/01_Active_Projects/aios/ (GitHub: TimoGoetz1988/aios)*
