# Prozess: Bestandsverwaltung

**Abteilung:** Operationen & Supply Chain  
**Agent:** OpsAgent  
**Trigger:** Echtzeit-Monitoring des Lagerbestands

## Ablauf

```
Trigger: Bestand unterschreitet Mindestmenge
  ↓
[OpsAgent → Inventory-Monitor] erkennt kritische Bestände
  ↓
[OpsAgent → Supplier-Coordinator] sendet automatische Bestellung
  ↓
[OpsAgent → Quality-Controller] plant Wareneingangs-Prüfung
  ↓
[OpsAgent → Analytics] aktualisiert Predictive-Analytics-Modell
  ↓
[CentralAgent] benachrichtigt Verantwortliche bei Abweichungen
```

## Beteiligte Skills

- `inventory-monitor` – Überwacht Lagerbestände in Echtzeit
- `supplier-coordinator` – Verwaltet Lieferantenbeziehungen und -bestellungen
- `quality-controller` – Koordiniert Qualitätsprüfungen
- `demand-forecaster` – Prognostiziert Bedarf anhand historischer Daten

## Erfolgskriterien

- Lieferengpässe: < 1 % aller Bestellungen
- Lagerkosten: Reduzierung um ≥ 15 % durch optimierte Bestellmengen
