# AI Career API

AI Career API, AI-assisted career matching demo uygulamasidir. Backend tarafinda Express + MongoDB, frontend tarafinda Vite + React kullanilir.

## Project Layout

- Backend: `server.js`
- Frontend: `client/`
- Reference docs: `docs/`
- API base URL: `http://localhost:5001/api`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend URL: `http://localhost:5173`

## Features

- CV olusturma ve listeleme
- CV guncelleme ve silme
- MongoDB tabanli job listeleme ve filtreleme
- Adzuna job import/fetch akisi
- CV tabanli recommendations
- Match score ve missing skills analizi
- Best CV for job akisi
- Analytics placeholder endpointleri
- Local demo auth + Career Passport verilerinin localStorage'da tutulmasi

## Requirements

- Node.js 20+ tavsiye edilir
- `npm`
- Local MongoDB veya MongoDB Atlas

## Setup

```powershell
cd ai-career-api
npm install
Copy-Item .env.example .env
```

`.env` icinde su alanlari kontrol edin:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ai-career-api
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

`.env.example` varsayilan olarak local MongoDB icin hazirdir. Atlas kullanacaksaniz sadece `MONGO_URI` degerini Atlas connection string ile degistirin.

Atlas ornek formati:

```text
mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ai-career-api?retryWrites=true&w=majority
```

## Local Development

Isterseniz once MongoDB baglantisini test edin:

```powershell
npm run check:db
```

`check:db` opsiyoneldir. Backend server zaten acilirken MongoDB'ye baglanmayi dener. Bu komutun amaci, server'i calistirmadan once sadece DB erisiminin dogru olup olmadigini hizlica kontrol etmektir.

Ne zaman kullanilir:

- `.env` icindeki `MONGO_URI` degerini yeni ayarladiysaniz
- Local MongoDB ile Atlas arasinda gecis yaptiysaniz
- Server ayakta ama DB endpointleri `503` donuyorsa

Ne zaman atlanabilir:

- Zaten baglantidan eminseniz
- Sadece frontend/UI gelistirmesi yapiyorsaniz

Baglanti hazir olduktan sonra demo CV verisini ekleyin:

```powershell
npm run seed:demo
```

`seed:demo` bir test verisi yukleme komutudur. MongoDB'ye `Demo Candidate` adinda tek bir demo CV kaydi olusturur veya ayni kaydi gunceller.

Ne zaman kullanilir:

- Projeyi ilk kez localde ayaga kaldirirken
- CV tabanli recommendation, filtering ve best-CV akislarini hizli test etmek istediginizde

Ne zaman kullanilmamali:

- Kendi test verinizi elle olusturuyorsaniz
- Demo verinin mevcut veriyi etkilemesini istemiyorsaniz

Calisma sirasi olarak onerilen akıs:

1. `.env` hazirla
2. Gerekirse `npm run check:db`
3. Ihtiyac varsa `npm run seed:demo`
4. `npm run server`
5. Ayrı terminalde `npm run client`

Iki terminal acin.

Backend:

```powershell
cd ai-career-api
npm run server
```

Frontend:

```powershell
cd ai-career-api
npm run client
```

## Useful Commands

```powershell
npm run check:db
npm run seed:demo
npm run server
npm run client
```

## Available API Surface

- `GET /api/health`
- `GET /api/cvs`
- `POST /api/cvs`
- `PUT /api/cvs/:id`
- `DELETE /api/cvs/:id`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/fetch`
- `GET /api/jobs/filter`
- `POST /api/jobs/import-adzuna`
- `POST /api/match`
- `POST /api/analysis`
- `GET /api/best-cv/:jobId`
- `GET /api/recommendations?cvId=...`
- `GET /api/analytics/skills`
- `GET /api/analytics/trends`

## Notes

- `MONGO_URI` yoksa backend acilir ama DB gerektiren endpointler `503` donebilir.
- `ADZUNA_APP_ID` ve `ADZUNA_APP_KEY` sadece Adzuna import endpointleri icin gerekir.
- Swagger backend tarafinda servis edilir; adres `http://localhost:5001/api-docs`.
- Demo sign-in/sign-up akisi localStorage tabanlidir; gercek auth sistemi degildir.

## Reference Documents

- `docs/API_Spec_ve_TechStack.pdf`
- `docs/AI-Career-Matching-Project-Summary.docx`
- `docs/ai-career-api-summary.html`
