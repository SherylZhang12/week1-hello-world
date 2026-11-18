# NYC restaurant directory

The Nov 18, 2026 snapshot comes from NYC Open Data's [DOHMH restaurant inspection results](https://data.cityofnewyork.us/Health/43nn-pn8j), via the `/resource/43nn-pn8j.json` endpoint. Records with geocoded coordinates and inspection dates after 2024-01-01 were grouped by establishment and listing details, sorted by most recent inspection, and deduplicated by CAMIS (keeping the newest listing). No inspection grades or personal/contact information are bundled.

Each row is CAMIS, public business name, cuisine description, address, latitude, longitude. This directory is not live and does not verify current operating status, menus, or allergens. Refresh the snapshot periodically.
