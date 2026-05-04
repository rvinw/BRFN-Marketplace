import os
import sys
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

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
