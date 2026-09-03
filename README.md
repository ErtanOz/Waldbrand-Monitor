# Waldbrand-Monitor — Deutschland & Türkiye

Eine Single-File-Webapp, die aktive Brände aus den Satellitendaten von **NASA FIRMS** auf einer Karte für Deutschland und die Türkei darstellt. Kein Build-Schritt, kein Backend, keine Abhängigkeit außer Leaflet: eine HTML-Datei, die im Browser läuft.

![Status](https://img.shields.io/badge/Daten-NASA%20FIRMS%20NRT-orange)
![Lizenz](https://img.shields.io/badge/Lizenz-MIT-blue)

## Funktionen

- **Zwei Länder in einer Karte** — Deutschland und Türkiye werden als getrennte Bounding Boxes abgefragt und zusammengeführt; Umschalter DE / TR / BEIDE über der Karte
- **Mehrere Sensoren kombinierbar** — VIIRS NOAA-20, NOAA-21 und Suomi-NPP zusammen (rund sechs Überflüge pro Tag statt zwei), alternativ MODIS
- **FRP-Spektrum als Filter** — Histogramm der Strahlungsleistung mit Schwellenregler, um schwache Signale (Feldbrände, Gasfackeln, Industrieanlagen) auszublenden
- **Hotspot-Cluster** — 0,15°-Raster, nach Summe der Strahlungsleistung sortiert, benannt nach nächstgelegenem Ort, Klick zoomt hin
- **Wetterkontext** — optional über OpenWeatherMap: Temperatur, Luftfeuchte und Wind am Brandort direkt im Popup
- **Export** — GeoJSON und CSV in EPSG:4326, direkt in QGIS ladbar
- **Ortszeit je Land** — Europe/Berlin bzw. Europe/Istanbul
- **Demo-Modus** — synthetische Testpunkte ohne API-Schlüssel, klar als solche gekennzeichnet

## Einrichtung

1. MAP_KEY kostenlos anfordern: <https://firms.modaps.eosdis.nasa.gov/api/map_key/> — es genügt eine E-Mail-Adresse, kein Earthdata-Konto
2. `index.html` im Browser öffnen (bei lokalen Dateien ggf. über einen kleinen Webserver, siehe unten)
3. Schlüssel ins Feld **NASA FIRMS MAP_KEY** eintragen und **Brände laden**

Lokal ausliefern, falls der Browser die Anfrage beim Öffnen per `file://` blockiert:

```bash
python3 -m http.server 8000
# danach http://localhost:8000 aufrufen
```

Über **GitHub Pages** läuft die App ohne weitere Schritte: Repository-Einstellungen → Pages → Branch `main`, Ordner `/ (root)`.

## Hinweise zur API

| Punkt | Wert |
| --- | --- |
| Endpunkt | `/api/area/csv/{MAP_KEY}/{SOURCE}/{west,süd,ost,nord}/{TAGE}` |
| Zeitraum | maximal **5** Tage pro Abfrage |
| Kontingent | 5.000 Transaktionen je 10-Minuten-Fenster, größere Abfragen zählen mehrfach |
| Latenz | NRT typischerweise ~3 Stunden nach Überflug; RT unter 60 Minuten; URT (unter 60 Sekunden) nur für USA und Kanada |
| Statusabfrage | `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=…` |

Der begrenzende Faktor ist nicht die Latenz, sondern der Orbit: ein polarumlaufender Satellit überfliegt einen Punkt etwa zweimal täglich (ca. 13:30 und 01:30 Ortszeit). Für kontinuierliche Beobachtung im 15-Minuten-Takt wären geostationäre Daten nötig (Meteosat/SEVIRI, 3 km Auflösung, über EUMETSAT).

## Interpretation der Daten

FIRMS meldet thermische Anomalien, keine Waldbrände. In Mitteleuropa stammt ein großer Teil der schwachen Signale zwischen 1 und 10 MW aus Stoppelabbrand, Feldbränden oder Industrieanlagen. Der FRP-Regler ist dafür da — ab etwa 15 MW bleibt in Deutschland überwiegend Relevantes übrig, in der Türkei liegt die sinnvolle Schwelle deutlich höher. VIIRS arbeitet mit 375 m Auflösung, MODIS mit 1 km.

## Sicherheit

Der MAP_KEY wird ausschließlich im Browser gehalten und nur an NASA gesendet. Er gehört **nicht** ins Repository und nicht in clientseitigen Code einer öffentlich erreichbaren Instanz — dort stattdessen über einen eigenen Proxy (n8n, Cloudflare Worker, nginx) leiten, der den Schlüssel serverseitig einsetzt. Da der Schlüssel an die E-Mail-Adresse gebunden und nicht ohne Weiteres austauschbar ist, lohnt sich diese Vorsicht.

## Datenquellen

- Branddaten: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (LANCE / EOSDIS), VIIRS und MODIS
- Wetter: [OpenWeatherMap](https://openweathermap.org/) (optional)
- Kartenhintergrund: © OpenStreetMap-Mitwirkende, © CARTO; Satellitenbild: Esri, Maxar, Earthstar Geographics
- Kartenbibliothek: [Leaflet](https://leafletjs.com/)

## Lizenz

MIT — siehe [LICENSE](LICENSE).
