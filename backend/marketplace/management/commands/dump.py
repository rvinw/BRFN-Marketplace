import os
from django.core.management.base import BaseCommand
from django.core.management import call_command

DUMPS = [
    {
        "app": "accounts",
        "path": "accounts/fixtures/initial_data.json",
    },
    {
        "app": "marketplace",
        "path": "marketplace/fixtures/initial_data.json",
        "exclude": ["marketplace.order", "marketplace.orderproducer", "marketplace.orderitem", "marketplace.orderstatushistory"],
    },
]


class Command(BaseCommand):
    help = "Dump the shared database content to fixture files so teammates can sync"

    def handle(self, *args, **options):
        for dump in DUMPS:
            path = os.path.abspath(dump["path"])
            self.stdout.write(f"Dumping {dump['app']} → {dump['path']} ...")

            kwargs = {
                "indent": 2,
                "output": path,
                "exclude": dump.get("exclude", []),
            }

            call_command("dumpdata", dump["app"], **kwargs)
            self.stdout.write(self.style.SUCCESS(f"  Done: {dump['path']}"))

        self.stdout.write(self.style.SUCCESS(
            "\nAll fixtures updated. Commit and push the fixture files so your team gets the latest data."
        ))
