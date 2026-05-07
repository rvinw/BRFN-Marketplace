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
### Google APi install for the map

npm install @react-google-maps/api

---

## Shared Database

The database is kept in sync across the team using two fixture files:
- `backend/accounts/fixtures/initial_data.json` — users, addresses, producer and customer profiles
- `backend/marketplace/fixtures/initial_data.json` — products, categories, allergens, community posts

Every time Docker starts, `backend/entrypoint.py` automatically runs migrations and loads both files.

### Adding data and sharing it with the team
Add your data via the app, then dump and push:
```bash
docker-compose exec web python manage.py dump
git add backend/accounts/fixtures/initial_data.json backend/marketplace/fixtures/initial_data.json
git commit -m "update shared database"
git push
```

### Getting a teammate's new data
Pull the latest code and restart Docker. The entrypoint loads the fixture files every time
Docker starts, adding any new records without touching data already in your database:
```bash
git pull
docker-compose restart web
```

### Normal restart
```bash
docker-compose up
```

# DESD AI Integration Setup Guide
## 1. Pull the branch
```bash
git fetch origin
git checkout ai-integration-clean
git pull origin ai-integration-clean
```
## 2. Add the AI model file manually
The model file is not pushed to GitHub because it is too large.
Which
freshness_model.h5
Place it here:
backend/marketplace/ai_services/freshness_model.h5
The folder should contain:
backend/marketplace/ai_services/
├── __init__.py
├── class_names.json
├── model_service.py
└── freshness_model.h5

## 3. Backend setup
From project root:
docker compose up --build
If OpenCV gives an error, run:
docker compose exec web pip uninstall -y opencv-python
docker compose exec web pip install opencv-python-headless
docker compose restart web
Check TensorFlow/OpenCV:
docker compose exec web python -c "import cv2; import tensorflow as tf; print('OK')"

## 4. Test backend AI endpoint
Use a local image path:
curl -X POST http://localhost:8000/api/ai/freshness-check/ \
  -F "image=@/image file path"
  
### Expected response:
{
  "predicted_class": "Banana__Healthy",
  "confidence": 99.99,
  "is_fresh": true,
  "gradcam_base64": "...",
  "explanation": "..."
}



## 5. Test Task 1
Login as a customer.
Go to:
/dashboard/customer
You should see:
Recommended For You
This shows AI reorder recommendations based on customer purchase history.

## 6. Test Task 2, 3 and 4
Login as a producer.
Go to:
/dashboard/producer
You should see:
AI Freshness Check
Upload a produce image and click:
Run AI Freshness Check
Expected output:
* predicted produce class
* fresh/rotten result
* confidence score
* explanation
* Grad-CAM heatmap

### AI Task Mapping
Task 1
Customer purchase-history recommendation system.
Task 2
Fresh/rotten produce image classification.
Task 3
Integrated trained MobileNetV2 model into DESD backend and frontend.
Task 4
Explainable AI using Grad-CAM heatmap.

### Important Notes
Do not commit:
freshness_model.h5
backend/db.sqlite3
__pycache__/
The model file must stay local only.

