# Diäten (Reisekostenberechnung)

Nach Kollektivvertrag Wien — Angestellte

---

## Grundlage

Taggeld entschädigt den persönlichen Mehraufwand für Verpflegung bei Dienstreisen außerhalb des Dienstortes.

**Berechnungsgrundlage:**
- Zählt: Gesamte ununterbrochene Abwesenheit **inkl. Fahrzeit**
- Zählt nicht: Mittagspause wird **abgezogen**

---

## Taggeld-Staffelung (pro Tag)

| Abwesenheit         | Betrag                                          |
|---------------------|-------------------------------------------------|
| Unter 6 Stunden     | € 0,00                                          |
| Genau 6 Stunden     | € 9,77                                          |
| Über 6 Stunden      | € 9,77 + € 4,03 je volle Stunde über der 6. Std |
| Maximum pro Tag     | € 31,77                                         |

**Beispiele:**

| Abwesenheit | Berechnung                        | Taggeld  |
|-------------|-----------------------------------|----------|
| 5h 59min    | unter 6h                          | € 0,00   |
| 6h          | Basis                             | € 9,77   |
| 7h          | 9,77 + 1 × 4,03                   | € 13,80  |
| 8h          | 9,77 + 2 × 4,03                   | € 17,83  |
| 9h          | 9,77 + 3 × 4,03                   | € 21,86  |
| 10h         | 9,77 + 4 × 4,03                   | € 25,89  |
| 11h         | 9,77 + 5 × 4,03                   | € 29,92  |
| ≥ 11h 30min | 9,77 + 5 × 4,03 → capped          | € 31,77  |

The cap of € 31,77 is reached at ~11.5h (5 full hours beyond the 6th = 5 × 4,03 = 20,15 + 9,77 = 29,92; one more full hour would exceed cap, so max applies).

---

## Nächtigungsgeld

Selten anwendbar — wird separat berechnet, nicht im System erfasst.

Gilt nur wenn:
- Abwesenheit > 11 Stunden **und**
- Übernachtung außer Haus erforderlich

Sondertarife für Hin-/Rückreisetag:
- Abreise vom Dienstort **vor 12 Uhr** → € 39,58
- Abreise vom Dienstort **nach 12 Uhr** → € 23,30
- Rückreise Ankunft **vor 17 Uhr** → € 23,30
- Rückreise Ankunft **nach 17 Uhr** → € 39,58

---

## Ausgeschlossene Kategorien

Folgende ZusatzZeiterfassung-Typen zählen **nicht** für Diäten:

| Kategorie     | Grund                                      |
|---------------|--------------------------------------------|
| Arztbesuche   | Kein Dienstreise-Mehraufwand               |
| Home Office   | Kein Aufenthalt außerhalb des Dienstortes  |
| Büro          | Kein Aufenthalt außerhalb des Dienstortes  |

> **Schulung:** Noch offen — muss noch geklärt werden ob und wie Schulungstage für Diäten zählen.

---

## Zukünftige Erweiterungen (geplant)

- [ ] **Ort-Angabe bei ZusatzZeiterfassung:** GL soll beim Eintrag auswählen können: `Home Office`, `Auto` (unterwegs), `Büro` — für korrekte Diäten-Zuordnung und Auswertung

---



GL-Einträge in **ZusatzZeiterfassung** mit `reason = 'dienstreise'`:
- Felder: `zeit_von` (HH:MM), `zeit_bis` (HH:MM), `entry_date`
- Dauer = zeit_bis − zeit_von (Mittagspause noch nicht automatisch abgezogen)
- Tabelle: `fb_zusatz_zeiterfassung`

---

## Offene Fragen / TODO

- [ ] Wie wird die Mittagspause erfasst / abgezogen? Fester Abzug (z.B. 30min) oder manuell?
- [ ] Ab welchem Datum soll die Berechnung starten?
- [ ] Ausgabe: Anzeige im Admin-Panel pro GL pro Monat, oder Export für Lohnbuchhaltung?
- [ ] Nächtigungsgeld: Wird das je relevant und wenn ja, wie wird Übernachtung erfasst?
