# R.R. Garden — Register PDF → Excel Digitization Toolkit (Handover Runbook)

This kit turns scanned handwritten guest-register PDFs into the tracker Excel.
It is written so that **any vision-capable AI agent (e.g. Opus-class) or a human
operator can run the whole process** without prior context. Everything except
*reading the handwriting* is scripted.

---

## 1. Requirements

| # | Requirement | Why |
|---|-------------|-----|
| 1 | Python 3.10+ with `pip install pymupdf openpyxl` | rendering PDFs, writing Excel |
| 2 | The scanned register PDFs (any file split works — 8 pages/file, 13 pages/file, anything; the tool auto-maps by page count) | source data |
| 3 | The tracker workbook `RR_Garden_Tracker.xlsx` with its `Guest Register` sheet (header in row 4, sample rows from row 5) | target format |
| 4 | A vision-capable agent/human who can read images of handwriting | the only non-scripted step |
| 5 | ~1 GB free disk for temporary renders | images |
| 6 | (optional) git for checkpoint commits after every ~5–10 pages | crash safety |

No paid OCR API is needed — the agent's own vision does the reading, so the
marginal cost is only the agent's tokens.

## 2. One-time setup & page-grouping verification (IMPORTANT)

1. Edit `config.json`: set `pdf_glob` to where the PDFs are, check
   `tracker_xlsx` / `output_xlsx` paths.
2. Run `python3 digitize.py verify`.
   - It prints the PDF → global-page mapping and renders the first logical page.
   - **Look at the rendered images** and decide the grouping:
     - Register page split across 2 PDF pages (left = S.No/Name/Age/Relationship/
       Nationality/Persons/Address, right = Phone/ComingFrom/Destination/Purpose/
       Arrival/Departure/Room + circled page-number stamp) → `group_size: 2`.
     - One PDF page shows *all* columns → `group_size: 1`.
     - Three PDF pages per register page → `group_size: 3`, and so on.
   - Cross-check: the circled number stamped on the right page should equal the
     logical page number P; the S.No column should run `12*(P-1)+1 … 12*P`.
     (For THIS register: group_size=2, 122 PDF pages = 60 register pages +
     2 hisaab-diary pages at the end; the diary is already in the
     `Hisaab Bookings` sheet.)
3. If you changed `group_size`, re-run `verify` until the samples look right.

## 3. The transcription loop (repeat for every register page P)

```
python3 digitize.py status          # tells you the next page P to do
python3 digitize.py render P        # renders images into render/
# -> READ the images (rules in TRANSCRIPTION_GUIDE.md) and write rows.json
python3 digitize.py save P < rows.json
rm render/g*                        # keep disk clean
```

Rendered files per page (group_size=2):
- `gXXX.jpg` — full left page (names/ages/IDs/address)
- `gYYY.jpg` — full right page, plus:
- `gYYY_c0.jpg`, `gYYY_c1.jpg` — top/bottom half of the right page at 4× zoom
  (phone → room columns; use these as the primary source for phone/dates/room)
- `gYYY_s0..s2.jpg` — phone-column strips at 6.5× zoom (use when a digit is unclear)

If a rendered image fails to open/display, re-render the same region with a
slightly different zoom/quality or as PNG, or split it into two smaller crops —
content is never lost, only the viewer occasionally rejects an image.

**Checkpoint** every 5–10 pages: `python3 digitize.py build` then `git add -A && git commit`.

## 4. Build the final Excel

```
python3 digitize.py build
```
- Appends every `data/pageNN.json` row after the existing Page-1 rows
  (rows 5–16 are never touched), copying the template row's formatting.
- Any cell containing `VERIFY` is highlighted yellow.
- Rebuild is **idempotent** — it deletes previously appended rows first, so you
  can run it as often as you like.
- Adds/refreshes the `Monthly Bookings & Ansh` sheet:
  bookings per month (COUNTIF on ArrivalDateTime text) × Rs 50 commission,
  auto-updating as more rows are added. Existing sheets
  (`Hisaab Bookings`, `Monthly Rate Trend`, `Settlement Notes`, `Expenses`)
  are preserved untouched.

## 5. Quality checklist before delivering

- [ ] `status` shows every register page saved.
- [ ] Spot-check 3 random pages: phone digits vs strip images.
- [ ] Arrival dates run roughly chronologically down the sheet (Nov 2024 → …).
- [ ] Yellow `VERIFY` cells are genuinely unclear ones, not laziness.
- [ ] `Monthly Bookings & Ansh` totals equal the number of appended rows.

## 6. Recovery / resume

All transcription lives in `data/pageNN.json` (one file per register page) and
`PROGRESS.md`. If the session dies at any point, a fresh agent just runs
`python3 digitize.py status` and continues from the next page. Nothing in the
Excel needs manual repair — `build` regenerates it from the JSONs.

## 7. Field priorities (what "accurate" means here)

1. **Phone** — must be exact; if any digit is doubtful write `VERIFY <best digits>`.
2. **ComingFrom / city** — correct (usually Kanpur; watch for Delhi/Lucknow/Auraiya/Meerut).
3. **Departure date+time, RoomNo** — correct almost always (rooms are 201–206).
4. **Arrival date+time, Age** — important.
5. Names / address / relationship / purpose — best effort is acceptable.

Full reading rules, JSON schema and handwriting tricks: `TRANSCRIPTION_GUIDE.md`.
