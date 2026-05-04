import os
import sys
import time
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Wait for the database to be ready before doing anything
print("Waiting for database...")
from django.db import connection
from django.db.utils import OperationalError

for attempt in range(30):
    try:
        connection.ensure_connection()
        print("Database ready.")
        break
    except OperationalError:
        print(f"  Not ready yet, retrying ({attempt + 1}/30)...")
        time.sleep(2)
else:
    print("Could not connect to the database after 60 seconds. Exiting.")
    sys.exit(1)

print("Running migrations...")
call_command("migrate", "--noinput")

fixtures = [
    "accounts/fixtures/initial_data.json",
    "marketplace/fixtures/initial_data.json",
]

for fixture in fixtures:
    if os.path.exists(fixture):
        print(f"Loading {fixture} ...")
        call_command("loaddata", fixture)
    else:
        print(f"No fixture found at {fixture} — skipping.")

print("Starting server...")
os.execv(sys.executable, [sys.executable, "manage.py", "runserver", "0.0.0.0:8000"])
