## Setup

### 1) Clone the repo
```bash
git clone https://github.com/rvinw/BRFN-Marketplace.git
cd BRFN-Marketplace
```

### 2) Setup virtual environment
#### Mac/Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows
```bash
py -m venv .venv
.venv\Scripts\activate
```

### 3) Install dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4) Add environment variables
Create a file at `frontend/.env` with the following:
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
Ask a teammate for the Google Maps API key.

### Temp Stuff
After activating the virtual environment, run the following command to start the application:
```bash
cd backend
python manage.py runserver
```
### for routing between webpages
in terminal run 
```bash
npm install react-router-dom
```

### Setting up development server to show the webpage
```bash
docker-compose up
```

```bash
npm run dev
```
### New Requirement code for image handling and fixing CORS error
python -m pip install Pillow
docker-compose exec web pip install django-cors-headers

---

## Shared Database

The database is kept in sync across the team using two fixture files:
- `backend/accounts/fixtures/initial_data.json` — users, addresses, producer and customer profiles
- `backend/marketplace/fixtures/initial_data.json` — products, categories, allergens, community posts

Every time Docker starts, `backend/entrypoint.py` automatically runs migrations and loads both files.

### Sharing your database with the team — follow these steps in order

> **Important:** dumping replaces the fixture files entirely with whatever is in YOUR database.
> If you dump without first loading the latest shared data, you will overwrite your teammates' data.
> Always follow these steps in order:

```bash
# 1. Pull the latest code and fixture files
git pull

# 2. Wipe your local database and reload from the latest shared fixtures
docker-compose down -v
docker-compose up --build

# 3. Add your data via the app (new producers, products, etc.)

# 4. Dump your database back to the fixture files (now contains shared + your data)
docker-compose exec web python manage.py dump

# 5. Commit and push
git add backend/accounts/fixtures/initial_data.json backend/marketplace/fixtures/initial_data.json
git commit -m "update shared database"
git push
```

### Getting the latest shared database after a pull
```bash
docker-compose down -v
docker-compose up
```
The `-v` flag wipes your local database so it reloads cleanly from the latest fixture files.

### Normal restart (keeps your local data)
```bash
docker-compose up
```
