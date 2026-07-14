# Transcription Guide (give this to the agent that reads the images)

You are transcribing one logical register page at a time from rendered images
into JSON. Each register page has ~12 numbered entries (S.No), each entry = one
booking = one JSON row.

## JSON schema (array of rows, one per S.No)

```json
[{"sno": 13, "name": "Utkarsh / Pooja", "age": "21 / 19", "rel": "Friend",
  "nat": "Indian", "num": 2, "addr": "Barra-8 / Barra-2", "phone": "6382679848",
  "from": "Kanpur", "dest": "Kanpur", "purpose": "Visit",
  "arr": "20/11/24 4:40pm", "dep": "20/11/24 5:20pm", "room": "202"}]
```

Feed it to `python3 digitize.py save <P>` on stdin.

## Column layout (group_size = 2)

- **Left PDF page**: S.No | Name of Visitor | Age | Accompanied with Relationship |
  Nationality/Passport No | No. of Persons | Full Address
- **Right PDF page**: Telephone No | Coming From | Next Destination | Purpose of
  Visit | Date & Time of Arrival | Date & Time of Departure | Room No | Signature
- Rows align by position: left entry k ↔ right entry k. **Count the 12 blocks on
  both sides before transcribing** — some blocks are empty/struck and must still
  be counted.

## Priorities

phone (exact!) > city/ComingFrom > departure date+time & room > arrival
date+time & age > everything else (best effort).

## Conventions

- Two guests in one entry → `"Name1 / Name2"`, `"age": "21 / 19"`, `num: 2`.
- Missing value → `""`. Blank/struck register row → keep the row with
  `"name": "(blank row in register)"` or `"(struck-out entry)"` so counts match.
- Unclear but important → prefix with `VERIFY`, e.g. `"VERIFY 6386717471"`
  (build highlights these yellow).
- Nationality column often contains Aadhaar/passport/PAN numbers → record as
  `"Indian (IDs 1234..., 5678...)"`.
- Purpose defaults to `Visit`; only write something else if clearly written
  (seen: Training, Party, Relation, PSIT Counselling).
- ComingFrom/Dest default `Kanpur` (KNP/KAN/कानपुर); watch for Delhi, Lucknow
  (LKO), Auraiya, Meerut, Balaghat, Nalanda.
- Dates d/m/yy like `20/11/24`; times with am/pm when written. Sloppy years
  (2024 written in Jan-2025 run) → use the true year implied by sequence.
- Rooms are 201–206 only. Anything else is a misread.

## Handwriting tricks that work on THIS register

- Writers draw **6 like "C/G"**, **7 with a hooked descender**, **5 angular flat-top**.
- **Phones**: verify digit count = 10 (Indian mobiles start 6–9; a leading 0 or
  9-digit number → VERIFY). Use the `_s*` strip images for doubtful digits.
- **Repeat guests are the best alignment check** — the same couples return
  weekly. Frequent numbers seen: 9696972862 (Abhay/Anjali), 8957011856
  (Sandeep/Saloni), 7380621774 (Amit Pal), 9984182961 (Ram Prakash/Puja),
  8115705855 (Aditya), 6392813154, 6394010145 (Deepu/Parul), 7905800319
  (Shailendra/Abhilasha), 9451930495 (Aman/Shweta), 8317064158 (Kartikey/Supriya),
  7388745618 (Pawan/Susma), 7521922052 (Avinash/Saloni), 8858377320
  (Santosh/Jyoti). If a row's phone matches a known couple, the row alignment
  is confirmed.
- **Arrivals run chronologically** down the page — use this to resolve
  ambiguous dates (25 vs 28) and am/pm. If a time has no meridiem and
  chronology can't decide, leave it without am/pm.
- Some entries are written in **Hindi (Devanagari)** — transliterate names when
  readable, else `"(Hindi name)"`; still capture digits (they are usually in
  Western numerals).
- Ditto marks (", '' , ,,) mean "same as the line above".
- One entry can span two sub-lines on the right page (each guest signs its own
  line with the same phone) — that is ONE booking, not two.

## Per-page procedure

1. Read left full image → names/ages/rel/nat+IDs/persons/address for 12 blocks.
2. Read right `_c0`/`_c1` crops → phone, from, dest, purpose, arrival,
   departure, room for the same 12 blocks.
3. Any doubtful phone digit → read the `_s0..s2` strips.
4. Room numbers cut off at the crop edge → render the right edge
   (x 0.62–1.0) once and read rooms + signatures (signatures also confirm names).
5. Assemble JSON, run the save command, delete renders, next page.
