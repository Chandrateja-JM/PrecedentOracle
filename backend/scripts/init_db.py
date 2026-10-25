"""
Initialize the PrecedentOracle SQLite database.
Run this once after pip install.

Usage:
    cd backend
    python scripts/init_db.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.database import init_schema, migrate_from_json, stats, DB_PATH


def main():
    print("─" * 60)
    print("PrecedentOracle — Database Initialization")
    print("─" * 60)
    print(f"Database file: {DB_PATH}")
    print()

    print("[1/2] Creating schema...")
    init_schema()
    print("      ✓ Tables created")

    print("[2/2] Loading existing JSON data into SQLite...")
    counts = migrate_from_json()
    for table, n in counts.items():
        if n > 0:
            print(f"      ✓ {n:4} {table}")

    print()
    print("Current corpus:")
    for table, n in stats().items():
        print(f"  {table:18} {n:5}")

    print()
    print("─" * 60)
    print("✓ Database ready.")
    print()
    print("Next step (optional): fetch 150+ more real cases from Indian Kanoon:")
    print("  python scripts/fetch_landmark_cases.py")
    print("─" * 60)


if __name__ == "__main__":
    main()
