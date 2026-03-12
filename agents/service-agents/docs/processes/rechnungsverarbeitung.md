# Prozess: Rechnungsverarbeitung

**Abteilung:** Finanzen & Controlling  
**Agent:** FinanceAgent  
**Trigger:** Eingehende Rechnung (E-Mail, Scan, EDI)

## Ablauf

```
Trigger: Rechnung eingeht
  ↓
[FinanceAgent → Invoice-Processor] extrahiert Rechnungsdaten (OCR/KI)
  ↓
[FinanceAgent → Budget-Analyzer] prüft Budgetverfügbarkeit
  ↓
  ├─ Betrag ≤ 500 €: automatische Genehmigung
  ├─ Betrag 501–5.000 €: Abteilungsleiter-Genehmigung
  └─ Betrag > 5.000 €: Geschäftsführer-Genehmigung
  ↓
[FinanceAgent → Payment-MCP] löst Zahlung aus
  ↓
[FinanceAgent → Report-Generator] aktualisiert Kostenberichte
```

## Beteiligte Skills

- `invoice-processor` – Liest und validiert Rechnungsdaten
- `budget-analyzer` – Prüft Kostenstellen und Budgetgrenzen
- `tax-calculator` – Berechnet Vorsteuer und Steuerabzüge
- `forecast-builder` – Aktualisiert Cash-Flow-Prognosen

## Erfolgskriterien

- Automatische Verarbeitung: ≥ 80 % aller Rechnungen
- Zahlungsziel eingehalten: ≥ 95 %
