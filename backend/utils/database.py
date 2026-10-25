"""
SQLite Database Layer for PrecedentOracle
══════════════════════════════════════════
Replaces flat JSON files with a real database.
Schema designed for legal research: cases, judges, statutes, citations.

Why SQLite (not Postgres):
  - Single file, ships with Python (no server)
  - Perfect for M.Tech demo & viva
  - Easy to back up (just copy the .db file)
  - Same SQL as Postgres if you ever upgrade

Tables:
  cases       - landmark judgments
  judges      - judicial profiles
  statutes    - bare acts / IPC / CrPC / Constitution
  citations   - citation index for fast lookup
  case_statutes  - many-to-many (which case applies which statute)
  case_citations - which case cites which case (for graph)
"""

import sqlite3
import json
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

DB_PATH = Path(__file__).parent.parent / "data" / "precedent_oracle.db"


def get_connection() -> sqlite3.Connection:
    """Open a connection that returns rows as dict-like objects."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema() -> None:
    """Create tables if they don't exist. Idempotent — safe to call repeatedly."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    c = conn.cursor()

    c.executescript("""
    -- ─── CASES ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS cases (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        citation        TEXT NOT NULL,
        alt_citation    TEXT,
        court           TEXT,
        year            INTEGER,
        category        TEXT,
        holding         TEXT,
        principle       TEXT,
        bench           TEXT,
        petitioner      TEXT,
        respondent      TEXT,
        importance      INTEGER DEFAULT 50,
        source_url      TEXT,
        raw_text        TEXT,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
    CREATE INDEX IF NOT EXISTS idx_cases_court    ON cases(court);
    CREATE INDEX IF NOT EXISTS idx_cases_year     ON cases(year);
    CREATE INDEX IF NOT EXISTS idx_cases_name     ON cases(name);

    -- ─── JUDGES ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS judges (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        court           TEXT,
        tenure          TEXT,
        landmark_cases  INTEGER DEFAULT 0,
        philosophy      TEXT,
        notable_quote   TEXT,
        years_active    INTEGER,
        importance      INTEGER DEFAULT 50
    );
    CREATE INDEX IF NOT EXISTS idx_judges_court ON judges(court);

    -- ─── STATUTES ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS statutes (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        short_name      TEXT,
        year            INTEGER,
        category        TEXT,
        sections_count  INTEGER DEFAULT 0,
        last_amendment  INTEGER,
        description     TEXT
    );

    -- ─── CITATION JOIN TABLES ────────────────────────
    CREATE TABLE IF NOT EXISTS case_statutes (
        case_id     TEXT NOT NULL,
        statute_ref TEXT NOT NULL,
        PRIMARY KEY (case_id, statute_ref),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS case_citations (
        citing_case_id TEXT NOT NULL,
        cited_case_id  TEXT NOT NULL,
        relationship   TEXT,  -- "supports", "overrules", "distinguishes", "follows"
        PRIMARY KEY (citing_case_id, cited_case_id),
        FOREIGN KEY (citing_case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (cited_case_id)  REFERENCES cases(id) ON DELETE CASCADE
    );

    -- ─── INGESTION LOG (track scraper runs) ──────────
    CREATE TABLE IF NOT EXISTS ingestion_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        source      TEXT,
        added_count INTEGER,
        ran_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()


def migrate_from_json() -> Dict[str, int]:
    """Load the existing JSON seed data into SQLite. Skips records that already exist."""
    data_dir = Path(__file__).parent.parent / "data"
    init_schema()
    conn = get_connection()
    c = conn.cursor()
    counts = {"cases": 0, "judges": 0, "statutes": 0, "case_statutes": 0}

    # ─── Cases ─────────────────────────────────────
    cases_path = data_dir / "landmark_cases.json"
    if cases_path.exists():
        with open(cases_path) as f:
            cases = json.load(f)
        for case in cases:
            c.execute("""
                INSERT OR IGNORE INTO cases
                  (id, name, citation, alt_citation, court, year, category,
                   holding, principle, bench, petitioner, respondent, importance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                case.get("id"),
                case.get("name"),
                case.get("citation", ""),
                case.get("alt_citation"),
                case.get("court"),
                case.get("year"),
                case.get("category"),
                case.get("holding"),
                case.get("principle"),
                case.get("bench"),
                (case.get("parties") or {}).get("petitioner"),
                (case.get("parties") or {}).get("respondent"),
                case.get("importance", 50),
            ))
            if c.rowcount > 0:
                counts["cases"] += 1
            # statute links
            for stat_ref in case.get("statutes_applied", []):
                c.execute(
                    "INSERT OR IGNORE INTO case_statutes (case_id, statute_ref) VALUES (?, ?)",
                    (case.get("id"), stat_ref),
                )
                if c.rowcount > 0:
                    counts["case_statutes"] += 1

    # ─── Judges ────────────────────────────────────
    judges_path = data_dir / "judges.json"
    if judges_path.exists():
        with open(judges_path) as f:
            judges = json.load(f)
        for j in judges:
            c.execute("""
                INSERT OR IGNORE INTO judges
                  (id, name, court, tenure, landmark_cases, philosophy, notable_quote, years_active, importance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                j.get("id"),
                j.get("name"),
                j.get("court"),
                j.get("tenure"),
                j.get("landmarkCases") or j.get("landmark_cases", 0),
                j.get("philosophy"),
                j.get("notableQuote") or j.get("notable_quote"),
                j.get("yearsActive") or j.get("years_active"),
                j.get("importance", 50),
            ))
            if c.rowcount > 0:
                counts["judges"] += 1

    # ─── Statutes (bare acts) ──────────────────────
    acts_path = data_dir / "bare_acts.json"
    if acts_path.exists():
        with open(acts_path) as f:
            acts = json.load(f)
        for a in acts:
            c.execute("""
                INSERT OR IGNORE INTO statutes
                  (id, name, short_name, year, category, sections_count, last_amendment, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                a.get("id"),
                a.get("name"),
                a.get("shortName") or a.get("short_name"),
                a.get("year"),
                a.get("category"),
                a.get("sectionsCount") or a.get("sections_count", 0),
                a.get("lastAmendment") or a.get("last_amendment"),
                a.get("description"),
            ))
            if c.rowcount > 0:
                counts["statutes"] += 1

    # Log the run
    c.execute(
        "INSERT INTO ingestion_log (source, added_count) VALUES (?, ?)",
        ("initial_json_seed", sum(counts.values())),
    )
    conn.commit()
    conn.close()
    return counts


# ─── Query helpers ──────────────────────────────────────

def list_cases(
    limit: int = 100,
    category: Optional[str] = None,
    court: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch cases with optional filters."""
    conn = get_connection()
    where = []
    params: List[Any] = []
    if category:
        where.append("category = ?"); params.append(category)
    if court:
        where.append("court = ?"); params.append(court)
    if search:
        where.append("(name LIKE ? OR principle LIKE ? OR holding LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like, like])
    where_clause = " WHERE " + " AND ".join(where) if where else ""
    params.append(limit)
    rows = conn.execute(
        f"SELECT * FROM cases{where_clause} ORDER BY importance DESC, year DESC LIMIT ?",
        params,
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not row:
        conn.close()
        return None
    case = dict(row)
    case["statutes_applied"] = [
        r["statute_ref"] for r in
        conn.execute("SELECT statute_ref FROM case_statutes WHERE case_id = ?", (case_id,))
    ]
    conn.close()
    return case


def list_judges(limit: int = 100, court: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    if court:
        rows = conn.execute(
            "SELECT * FROM judges WHERE court = ? ORDER BY importance DESC LIMIT ?",
            (court, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM judges ORDER BY importance DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_statutes(limit: int = 100) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM statutes ORDER BY year DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def stats() -> Dict[str, int]:
    """Quick row counts for the /api/status endpoint."""
    conn = get_connection()
    out = {}
    for table in ("cases", "judges", "statutes", "case_statutes", "case_citations"):
        try:
            out[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        except sqlite3.OperationalError:
            out[table] = 0
    conn.close()
    return out


def insert_case(case: Dict[str, Any]) -> bool:
    """Insert a single case (used by Indian Kanoon scraper)."""
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""
            INSERT OR REPLACE INTO cases
              (id, name, citation, alt_citation, court, year, category,
               holding, principle, bench, petitioner, respondent, importance, source_url, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case.get("id"), case.get("name"), case.get("citation", ""),
            case.get("alt_citation"), case.get("court"), case.get("year"),
            case.get("category"), case.get("holding"), case.get("principle"),
            case.get("bench"), case.get("petitioner"), case.get("respondent"),
            case.get("importance", 50), case.get("source_url"), case.get("raw_text"),
        ))
        for s in case.get("statutes_applied", []):
            c.execute(
                "INSERT OR IGNORE INTO case_statutes (case_id, statute_ref) VALUES (?, ?)",
                (case["id"], s),
            )
        conn.commit()
        return True
    except Exception as e:
        print(f"insert_case failed: {e}")
        return False
    finally:
        conn.close()
