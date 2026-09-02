# Mars Rover Fehlercodes

Dieser Katalog ist die zentrale Referenz fuer Fehler, die Benutzern in Mars Rover angezeigt werden. Er wird erweitert, sobald eine ungenaue oder falsche Fehlermeldung auffaellt.

## Regeln

1. Jede sichtbare Fehlermeldung fuer einen fehlgeschlagenen API-Vorgang braucht einen stabilen Fehlercode.
2. Die Meldung darf keine Ursache behaupten, die technisch nicht belegt ist. Ein unbekannter Fehler ist kein Internetfehler.
3. Backend-Antworten verwenden dieses Format:

```json
{
  "error": "Konkrete, handlungsorientierte Meldung",
  "code": "MR-BEREICH-FALL-001",
  "field": "optionales_feld"
}
```

4. Der Frontend-Service muss `code`, HTTP-Status und `field` erhalten und an die UI weitergeben.
5. Die UI zeigt die konkrete Meldung und den Fehlercode. Technische Interna oder sensible Daten werden nicht angezeigt.
6. Neue Codes werden nicht fuer eine andere Bedeutung wiederverwendet.

## Code-Schema

`MR-<BEREICH>-<FALL>-<NUMMER>`

Beispiele: `MR-AUTH-001`, `MR-NETWORK-001`, `MR-VISIT-TIME-END-001`.

## Allgemein

| Code | Bedeutung | Meldung / Reaktion |
| --- | --- | --- |
| `MR-NETWORK-001` | Der Server konnte technisch nicht erreicht werden. | Verbindung pruefen und erneut versuchen. Nur dieser Fall darf als Verbindungsproblem bezeichnet werden. |
| `MR-AUTH-001` | Sitzung fehlt, ist abgelaufen oder wurde abgelehnt. | Neu anmelden. |

## Marktbesuch

| Code | Bedeutung | Meldung / Reaktion |
| --- | --- | --- |
| `MR-VISIT-TIME-START-001` | Startzeit hat kein gueltiges `HH:MM`-Format. | Startzeit korrigieren. |
| `MR-VISIT-TIME-START-002` | Startzeit fehlt beim Abschluss. | Startzeit eintragen. |
| `MR-VISIT-TIME-END-001` | Endzeit hat kein gueltiges `HH:MM`-Format. | Endzeit korrigieren. |
| `MR-VISIT-TIME-END-002` | Endzeit fehlt beim Abschluss. | Marktbesuch beenden oder Endzeit eintragen. |
| `MR-VISIT-TRAVEL-START-001` | Fahrzeit-Start hat kein gueltiges Zeitformat. | Fahrzeit-Start korrigieren. |
| `MR-VISIT-TRAVEL-END-001` | Fahrzeit-Ende hat kein gueltiges Zeitformat. | Fahrzeit-Ende korrigieren. |
| `MR-VISIT-CONTEXT-001` | Benutzer- oder Marktinformation fehlt. | Besuch neu aus der Marktansicht starten; bei Wiederholung Support mit Code informieren. |
| `MR-VISIT-CONTEXT-002` | Fragebogen und Marktbesuch passen nicht zusammen. | Nicht erneut senden; Support mit Code informieren. |
| `MR-VISIT-RESPONSE-001` | Zugehoeriger Fragebogen-Datensatz fehlt. | Support mit Code informieren. |
| `MR-VISIT-NOT-FOUND-001` | Zu aktualisierender Marktbesuch fehlt. | Besuch neu laden; bei Wiederholung Support mit Code informieren. |
| `MR-VISIT-CREATE-001` | Marktbesuch konnte serverseitig nicht angelegt werden. | Erneut versuchen; bei Wiederholung Support mit Code informieren. |
| `MR-VISIT-CREATE-002` | Anlegen lieferte keine gueltige Besuchs-ID. | Erneut versuchen; bei Wiederholung Support mit Code informieren. |
| `MR-VISIT-UPDATE-001` | Bestehender Marktbesuch konnte serverseitig nicht aktualisiert werden. | Erneut versuchen; bei Wiederholung Support mit Code informieren. |
| `MR-VISIT-SAVE-001` | Unerwarteter Abschlussfehler ohne spezifischeren Code. | Erneut versuchen und den Code melden. |

## Einen neuen Code aufnehmen

1. Den echten technischen Ausloeser identifizieren.
2. Einen noch nicht verwendeten Code vergeben.
3. Backend und Frontend so verbinden, dass der Code nicht verloren geht.
4. Eine kurze Meldung schreiben, die erklaert, was passiert ist und was der Benutzer tun kann.
5. Den Code in diesem Dokument ergaenzen.
