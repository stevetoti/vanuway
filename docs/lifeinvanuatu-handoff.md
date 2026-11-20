# Life in Vanuatu → VanuWay ride handoff (contract v1)

Copied from the Life in Vanuatu repository (`docs/vanuway/handoff-contract.md` on branch `claude/vanuway-handoff`). The two copies must stay the same; change both together.

Written 2026-11-21 by Claude Code (`claude/vanuway-handoff`). The VanuWay side
is on `claude/lifeinvanuatu-handoff` in the VanuWay repository.

## What it is for

Someone plans a trip in the virtual Port Vila and taps **Book a real ride**.
Life in Vanuatu shows a confirm sheet (From, To, People, Opens VanuWay), then
opens VanuWay with the trip filled in. VanuWay shows its own ride form. The
person checks the trip, picks a vehicle and payment, and confirms there.
Life in Vanuatu never books, prices or dispatches anything. Prices, drivers
and availability are confirmed only in VanuWay.

## The URL

```
https://app.vanuway.com/rides?v=1
  &pickup_lat=-17.74160&pickup_lng=168.31190&pickup_name=Port+Vila+Central+Market
  &drop_lat=-17.70173&drop_lng=168.31964&drop_name=Bauerfield+Airport
  &passengers=3
  &source=lifeinvanuatu&ref=place%3Aairport
  &utm_source=lifeinvanuatu&utm_medium=referral&utm_campaign=virtual_ride&utm_content=ride_panel
```

(One line in practice; broken up here to read.)

The path is the existing **`/rides`** hub. VanuWay sends a request that has
handoff fields on to its public **`/rides/new`** form, which fills them in.
`/rides/new?...` with the same fields also works directly. `/rides` was chosen
so that the two apps can be released in either order: before VanuWay's
release, `/rides` ignores the extra fields and opens the ride hub as it does
today; after it, the same link opens the filled-in form.

Life in Vanuatu reads the base from `NEXT_PUBLIC_VANUWAY_RIDE_URL` when it is
set (used for local testing, for example `http://127.0.0.1:3075/rides`).
Otherwise it uses `https://app.vanuway.com/rides`.

## Fields

| field | type | rule |
|---|---|---|
| `v` | `1` | Contract version. VanuWay ignores a version it doesn't know. |
| `pickup_lat`, `pickup_lng` | decimal degrees | WGS84. Both or neither. Rounded to 5 decimal places (about 1 m). |
| `pickup_name` | text | A label to show, never an address the person must trust. |
| `drop_lat`, `drop_lng` | decimal degrees | As for pickup. |
| `drop_name` | text | As for pickup. |
| `passengers` | integer | 1–8. Life in Vanuatu sends its travel-group size (1–5). |
| `source` | `lifeinvanuatu` | Fixed. Marks a handoff. |
| `ref` | text | The destination's Life in Vanuatu id: `place:<id>` (a featured place) or `poi:<id>` (an OpenStreetMap business, for example `poi:n3380352152`). |
| `utm_source` | `lifeinvanuatu` | Fixed. |
| `utm_medium` | `referral` | Fixed. |
| `utm_campaign` | `virtual_ride` | Fixed. |
| `utm_content` | text | Where the button was: `ride_panel`, `where_to`, `my_day`, `place_panel`, `driver_chat`. |

Coordinates are real-world. Featured places carry latitude and longitude in
`src/lib/places.ts`. Points in the 3D city (the avatar's spot, OpenStreetMap
businesses) are converted back from scene units with the inverse of
`project()`: `lon = x·5/106050 + 168.314`, `lat = −y·5/111320 − 17.739`.

## Limits and encoding

- Encoding is standard `application/x-www-form-urlencoded`, as produced by
  `URLSearchParams` (space becomes `+`, UTF-8 percent-encoded). Both apps read
  and write with `URLSearchParams` only; neither hand-builds query strings.
- Names: whitespace collapsed, control characters removed, trimmed, cut to 80
  characters (on a character boundary, never inside an emoji or accent).
  VanuWay treats them as plain text (React escapes them) and applies the same
  cut again.
- Coordinates must be finite and inside a Vanuatu box: latitude −21.0 to
  −12.5, longitude 165.5 to 171.0. Anything else is dropped, on both sides.
- `passengers`: a non-integer is rounded; then the value is clamped to 1–8.
  Missing or unreadable means 1.
- `ref`: `[A-Za-z0-9:_./-]`, at most 64 characters, otherwise dropped.
- A whole link stays well under 1,000 characters.

## When a field is missing or not supported yet

- **Missing pickup or destination.** Life in Vanuatu sends what it has; the
  sheet says "Choose in VanuWay" for the missing line. VanuWay opens the form
  at the first step that still needs an answer.
- **VanuWay drops a field it can't use** (out of the box, bad number, unknown
  version). The form behaves as if the field was never sent. Nothing is
  guessed.
- **VanuWay hasn't released the handoff yet.** `/rides` opens the ride hub
  as it does today, and the person enters the trip by hand. The confirm sheet
  never promises the trip is pre-filled, only that it opens VanuWay.
- **New fields later** (time, luggage, vehicle type): VanuWay ignores unknown
  fields, so Life in Vanuatu can add them before VanuWay reads them. Breaking
  changes need `v=2`.

## Confirmation and sign-in

- Nothing is requested from the link alone. VanuWay pre-fills the form and
  waits for the person to choose a vehicle and payment and tap its own
  button.
- `/rides/new` is public, so a visitor can see their trip before signing in.
  When they continue, VanuWay keeps the trip in `sessionStorage` (this tab
  only, for 30 minutes) and returns them to `/rides/new` after sign-in.

## Privacy

- Only places the person chose are sent: a featured place, an OpenStreetMap
  business, or the spot where their **avatar** stands in the virtual city.
- Life in Vanuatu never reads device GPS for this. VanuWay's own "use my
  location" button still asks the browser first, as it does today.
- No account id, email, name, device id or saved list goes in the link. The
  travel-group size is a number only, never names.
- The link opens in a new tab with `rel="noopener noreferrer"`, so VanuWay
  doesn't receive the Life in Vanuatu page address.

## Attribution

`source=lifeinvanuatu` plus the `utm_*` fields let VanuWay count rides that
started in Life in Vanuatu, and from which button. VanuWay's form keeps the
values while the person is on it. Storing them with the booking (a
`ride_bookings` column) is a later, separate VanuWay change. This change
doesn't touch VanuWay's database.
