# P3 Alembic migrations

- `20261008_0001` reproduces the P1 legacy schema baseline without application data.
- `20261008_0002` applies the approved P3 type, relationship, uniqueness, and range fixes.

Existing databases must be backed up and validated before they are stamped at the baseline revision. Never stamp an empty or structurally different database just to bypass migrations.
