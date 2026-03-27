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

### Temp Stuff
After activating the virtual environment, run the following command to start the application:
```bash
cd backend
python manage.py runserver
```
### for routing between webpages
in terminal run 
```bash

### Run the webpage
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
