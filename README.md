# AI Career API

AI Career API, AI-assisted career matching demo uygulamasidir. Backend tarafinda Express + MongoDB, frontend tarafinda Vite + React kullanilir.

## Project Layout

- Backend: `backend/`
- Frontend: `frontend/`
- Reference docs: `docs/`
- API base URL: `http://localhost:5001/api`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend URL: `http://localhost:5173`

```text
ai-career-api/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    scripts/
    services/
    server.js
  frontend/
    src/
    index.html
  docs/
  package.json
```

## Features

- CV olusturma ve listeleme
- CV guncelleme ve silme
- MongoDB tabanli job listeleme ve filtreleme
- Adzuna job import/fetch akisi
- CV tabanli recommendations
- Match score ve missing skills analizi
- Best CV for job akisi
- Analytics ve Career Matrix endpointleri
- JWT tabanli register/login akisi
- Kullanici profili ve Career Passport verilerinin MongoDB'de tutulmasi
- Chart.js ile analytics gorsellestirme
- Tailwind CSS pipeline kurulumu

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
JWT_SECRET=replace_this_local_dev_secret
VITE_BACKEND_ORIGIN=http://localhost:5001
```

`.env.example` varsayilan olarak local MongoDB icin hazirdir. Atlas kullanacaksaniz sadece `MONGO_URI` degerini Atlas connection string ile degistirin.

Atlas ornek formati:

```text
mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ai-career-api?retryWrites=true&w=majority
```

## Local Development

Tum dev komutlari proje root klasorunden calistirilir:

```powershell
cd ai-career-api
```

Klasor yapisi degisti ama komut calistirma modeli ayni kaldi:

- Backend kodlari `backend/` altindadir, ancak server root'tan `npm run server` ile baslatilir.
- Frontend kodlari `frontend/` altindadir, ancak Vite root'tan `npm run client` ile baslatilir.
- DB scriptleri `backend/scripts/` altindadir, ancak root'tan `npm run check:db` ve `npm run seed:demo` ile calistirilir.
- Normal dev akista `cd backend` veya `cd frontend` yapmaniz gerekmez.

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

Not: CV kayitlari artik kullanici bazli izole edilir. `seed:demo` owner bilgisi olmayan genel bir demo kaydi olusturur; normal login olan kullanicilar kendi hesaplarinda sadece kendilerinin olusturdugu CV'leri gorur.

Ne zaman kullanilir:

- Projeyi ilk kez localde ayaga kaldirirken
- CV tabanli recommendation, filtering ve best-CV akislarini hizli test etmek istediginizde

Ne zaman kullanilmamali:

- Kendi test verinizi elle olusturuyorsaniz
- Demo verinin mevcut veriyi etkilemesini istemiyorsaniz

Calisma sirasi olarak onerilen akis:

1. `.env` hazirla
2. Gerekirse `npm run check:db`
3. Ihtiyac varsa `npm run seed:demo`
4. `npm run server`
5. Ayri terminalde `npm run client`

Iki terminal acin.

Backend:

```powershell
cd ai-career-api
npm run server
```

Bu komut arkada `node backend/server.js` calistirir.

Frontend:

```powershell
cd ai-career-api
npm run client
```

Bu komut Vite'i `frontend/` root'u ile calistirir.

## Useful Commands

```powershell
npm run check:db
npm run seed:demo
npm run server
npm run client
```

Scriptlerin arka planda calistirdigi dosyalar:

- `npm run server` -> `backend/server.js`
- `npm run client` -> `frontend/` Vite app
- `npm run check:db` -> `backend/scripts/checkDb.js`
- `npm run seed:demo` -> `backend/scripts/seedDemo.js`

## Available API Surface

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api-docs`

Protected with `Authorization: Bearer <token>`:

- `GET /api/health`
- `GET /api/me`
- `PUT /api/me`
- `PUT /api/me/passport`
- `GET /api/cvs`
- `POST /api/cvs`
- `POST /api/cvs/generate`
- `POST /api/cvs/rank-for-job`
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
- `GET /api/applications?userEmail=...`
- `POST /api/applications`
- `PATCH /api/applications/:id/status`
- `GET /api/analytics/skills`
- `GET /api/analytics/trends`
- `POST /api/career-matrix`

## Notes

- `MONGO_URI` yoksa backend acilir ama DB gerektiren endpointler `503` donebilir.
- `ADZUNA_APP_ID` ve `ADZUNA_APP_KEY` sadece Adzuna import endpointleri icin gerekir.
- Swagger backend tarafinda servis edilir; adres `http://localhost:5001/api-docs`.
- Sign-in/sign-up akisi JWT tabanlidir. Frontend token'i localStorage'da tutar.
- Swagger haric tum `/api/*` endpointleri register/login disinda JWT ister.
- CV kayitlari kullanici bazli scope edilir; bir kullanici baska kullanicinin CV listesini, recommendation CV context'ini veya best-CV hesaplamasini gormez.
- Frontend stilleri Tailwind utility class yapisina tasindi; `styles.css` sadece global/base stilleri tutar.

## Reference Documents

- `docs/API_Spec_ve_TechStack.pdf`
- `docs/AI-Career-Matching-Project-Summary.docx`
- `docs/ai-career-api-summary.html`
