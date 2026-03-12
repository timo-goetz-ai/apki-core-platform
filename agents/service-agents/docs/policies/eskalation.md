# Eskalationsrichtlinie

**Geltungsbereich:** Alle Agenten  
**Zweck:** Definiert, wann ein Agent einen Menschen einbeziehen muss.

## Eskalationsstufen

| Stufe | Auslöser | Maßnahme | Reaktionszeit |
|---|---|---|---|
| 1 | Konfidenz < 70 % | Menschliche Überprüfung anfordern | 2 h |
| 2 | Fehler bei kritischem Prozess | Abteilungsleiter benachrichtigen | 30 min |
| 3 | Sicherheitsvorfall | IT-Security + Geschäftsführung | Sofort |
| 4 | Datenschutzverletzung | DSGVO-Meldepflicht + Datenschutzbeauftragter | Sofort |

## Automatische Eskalationsbedingungen

- Mehr als 3 fehlgeschlagene Verarbeitungsversuche
- Anomalie in Finanztransaktion > 10 % Abweichung vom Erwartungswert
- Negativer Kunden-Sentiment-Score < 2 / 5 über 3 aufeinanderfolgende Interaktionen
- Systemverfügbarkeit < 99,5 % in einer Stunde

## Eskalationskanal

```
Agent → CentralAgent → Abteilungsleiter (E-Mail + Chat)
                     → Bei Stufe 3/4: Geschäftsführung + Juristische Abteilung
```
