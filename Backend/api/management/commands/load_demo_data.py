from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load synthetic CSV datasets into the database."

    def handle(self, *args, **options):
        from pathlib import Path

        loader = Path(__file__).resolve().parents[3] / "datasets" / "load_datasets.py"
        exec(loader.read_text(encoding="utf-8"), {"__name__": "__main__"})
        self.stdout.write(self.style.SUCCESS("Demo datasets loaded successfully."))
