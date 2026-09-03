# Waldbrand-Monitor — Deutschland & Türkiye

Eine schlanke Webapp, die aktive Brände aus den Satellitendaten von **NASA FIRMS** auf einer Karte für Deutschland und die Türkei darstellt. Die statische Oberfläche läuft ohne Build-Schritt; eine Netlify Function schützt den NASA-Zugangsschlüssel.

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

1. MAP_KEY kostenlos anfordern: <https://firms.modaps.eosdis.nasa.gov/api/map_key/> — es genügt eine E-Mail-Adresse, kein Earthdata-Konto.
2. In Netlify unter **Project configuration → Environment variables** die Variable `NASA_FIRMS_MAP_KEY` anlegen und auf den Scope **Functions** beschränken.
3. Optional einen kostenlosen, domaingebundenen [CARTO Basemap API-Key](https://carto.com/basemaps/apikey/) anfordern. Ohne diesen verwendet die App automatisch einen OpenStreetMap-Fallback.
4. Lokal mit `npx netlify dev` starten oder das Repository über Netlify deployen.

Lokal ausführen:

```bash
npx netlify dev
```

Die Live-Daten benötigen die Netlify Function. GitHub Pages kann weiterhin die Oberfläche und den Demo-Modus anzeigen, besitzt aber keinen sicheren serverseitigen Zugriff auf den NASA-Key.

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

Der FIRMS MAP_KEY wird ausschließlich als Netlify Environment Variable gespeichert und serverseitig von der Function gelesen. Er erscheint weder im Repository noch im Browser. Die Function validiert die Parameter, begrenzt Anfragen pro IP und nutzt CDN-Caching, um das NASA-Kontingent zu schützen.

Der CARTO-Key wird ebenfalls nicht im Quellcode hinterlegt. CARTO-Basemap-Keys sind für Client-Anwendungen vorgesehen, sollten aber auf die verwendete Domain beschränkt und nicht zwischen unabhängigen Projekten geteilt werden.

## Datenquellen

- Branddaten: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (LANCE / EOSDIS), VIIRS und MODIS
- Wetter: [OpenWeatherMap](https://openweathermap.org/) (optional)
- Kartenhintergrund: © OpenStreetMap-Mitwirkende, © CARTO; Satellitenbild: Esri, Maxar, Earthstar Geographics
- Kartenbibliothek: [Leaflet](https://leafletjs.com/)

## Lizenz

MIT — siehe [LICENSE](LICENSE).
