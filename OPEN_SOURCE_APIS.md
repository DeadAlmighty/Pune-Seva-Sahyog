# Open Source / Public APIs for Pune Seva Sahyog (ML + DS + Healthcare)

This list is for features like smart ranking, NLP search, prediction, anomaly detection, and healthcare-focused discovery.

## 1) Maps, Geocoding, Distance, Routing

### OpenStreetMap (OSM)
- Type: Open geospatial data (not a hosted API by itself)
- Use for: base map/place data, healthcare location enrichment
- Link: https://www.openstreetmap.org

### Nominatim (OSM Geocoding)
- Type: Geocoding / reverse geocoding
- Use for: convert addresses ↔ lat/lon, area normalization
- Link: https://nominatim.org/release-docs/latest/api/Overview/

### OSRM (Open Source Routing Machine)
- Type: Routing / travel distance and ETA
- Use for: nearest-service ranking by travel time
- Link: https://project-osrm.org

### OpenRouteService
- Type: Routing, isochrones, matrix APIs
- Use for: accessibility-aware service ranking
- Link: https://openrouteservice.org/dev/#/api-docs

## 2) Weather + Environment (for demand and risk signals)

### Open-Meteo
- Type: Free weather API
- Use for: weather impact features in demand prediction
- Link: https://open-meteo.com

### OpenWeather (free tier)
- Type: Weather API
- Use for: optional weather-based demand context
- Link: https://openweathermap.org/api

### OpenAQ
- Type: Air quality data API
- Use for: respiratory-risk and health alert context
- Link: https://openaq.org

## 3) Healthcare and Clinical Knowledge APIs

### World Health Organization (WHO) Data API
- Type: Public health indicators
- Use for: benchmark trends, health context overlays
- Link: https://www.who.int/data/gho/info/gho-odata-api

### World Bank Open Data API
- Type: Public indicators (health + socio-economic)
- Use for: macro indicators for DS experimentation
- Link: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

### CDC Open Data
- Type: Public health datasets
- Use for: reference modeling experiments
- Link: https://data.cdc.gov

### NIH ClinicalTables API
- Type: Clinical vocabularies/search utilities
- Use for: symptom/condition normalization in NLP
- Link: https://clinicaltables.nlm.nih.gov/apidoc/

### RxNorm API (NLM)
- Type: Drug vocabulary API
- Use for: medicine name standardization
- Link: https://lhncbc.nlm.nih.gov/RxNav/APIs/

### SNOMED CT (via SNOMED International resources)
- Type: Clinical terminology (license terms apply by region)
- Use for: structured healthcare tagging
- Link: https://www.snomed.org/snomed-ct/get-snomed

## 4) NLP + Search + ML (Open Source Tooling/APIs)

### Hugging Face Inference API (free tier available)
- Type: NLP model inference
- Use for: multilingual intent classification, query understanding
- Link: https://huggingface.co/inference-api

### spaCy + FastAPI (self-hosted)
- Type: Open-source NLP stack
- Use for: local intent extraction and entity recognition
- Link: https://spacy.io

### Elasticsearch / OpenSearch
- Type: Search + typo tolerance + ranking
- Use for: semantic + keyword hybrid service search
- Link: https://www.elastic.co/elasticsearch
- Link: https://opensearch.org

## 5) Real-time and Utility APIs

### Twilio Verify / Messaging (not open source; optional paid integration)
- Type: Communication APIs
- Use for: fallback notifications, callback workflows
- Link: https://www.twilio.com/docs

### Exotel / MSG91 (India-focused, paid)
- Type: Calls/SMS APIs
- Use for: localized communication workflows
- Link: https://developer.exotel.com
- Link: https://msg91.com

## 6) Suggested First APIs to Start With

1. Nominatim (geocoding)
2. OpenRouteService or OSRM (distance/time ranking signals)
3. Open-Meteo (prediction context)
4. Hugging Face Inference API (multilingual intent baseline)

## 7) Quick Notes Before Integration

- Add provider fallback (primary + backup API) for reliability.
- Cache responses to reduce latency and quota usage.
- Keep healthcare outputs assistive (non-diagnostic).
- Store only minimal user/location data and define retention policy.
- Add source + `last_verified_at` metadata to all externally fetched records.
