# Thanksgiving RSVP: Scope

Status: v1 built and tested locally. Deployment to Railway is next.

## Goal

A tiny website for one Thanksgiving. The host shares one link with family and friends. Guests say "I'm coming", say how many people are in their party, and pick what they will bring. The host can see everything, merge duplicates, and review a log of changes.

Personal use, one event, low traffic (probably under 50 people). Simple beats clever. The audience is not tech savvy, so every flow must be obvious.

## How to think about it

- **The website is the invite.** There is no invite list and no "invited" state.
- **RSVPing means "I'm coming".** Someone who has not RSVPed is simply not on the list.
- **"Not coming" means not on the list.** A guest who RSVPed and later can't make it taps "I can't make it anymore". Their spot and dishes are released, and the host can still see in the log that it happened.
- The word "RSVP" in the UI should read plainly, for example "I'm coming" and "I can't make it anymore".

## Who uses it

- **Guest**: opens the shared link on a phone, says they're coming, can come back later to change or cancel.
- **Host (you)**: sets up the event and the bring list, watches who is coming, merges duplicates.

## Core features (v1)

### 1. Signing up
- Guest enters first name and last name, and a party size (total people, including themselves).
- Guest picks dishes from the bring list, adds their own, or brings nothing.
- No notes or dietary field. Keep the form short.

### 2. Bring list (public)
- Host predefines items, for example: turkey, mashed potatoes, rolls, pumpkin pie, drinks, ice.
- Everyone sees each item as **Taken** or **Still needed**.
- A guest can claim an item, release it, or add their own dish ("Grandma's green bean casserole").
- Optional per item: how many are needed (for example, 2 pies).

### 3. Visibility rules (decided)
- **Bring list is public.** Anyone with the link sees each item as **Taken** or **Still needed**.
- **Names are hidden until you're signed up.** A visitor who has not signed up sees only "Taken", never who took it.
- **Once you're signed up as coming, you see who is bringing what.** Someone who has not signed up, or who has cancelled, goes back to seeing only "Taken".
- **Only the host sees the full guest list** and party sizes. A guest sees their own entry plus the names on the bring list.
- This is enforced on the server. Hidden names must never be sent to the browser, only hidden by the UI.

### 4. Come back and edit
- A guest can return and change their party size or dishes, or cancel.
- No accounts, passwords, PINs, or links to save. See "Identity".

### 5. Change log
- Every sign up, edit, cancel, claim, release, merge, and host change is recorded with a timestamp, who, and before/after values.
- Host can view the log on a simple page.

### 6. Host view
- Totals: people coming, total head count.
- Full guest list.
- Merge duplicate entries (see "Merging").
- Bring list status, and edit or add items.
- Edit event details: title, date, time, address.
- Change log.

## Identity: no accounts, honor system

Goal is to prevent accidents, not determined people. We are **not** solving for someone signing up as another person. The change log is the safety net.

**How a guest gets back to their entry:**
1. **Browser memory (automatic).** After signing up, the browser remembers which entry is theirs. Next visit: "Welcome back, Sue. Want to change anything?" They do nothing to set this up.
2. **"Already signed up?" button (fallback).** For a new phone or cleared browser. They type first name and last name to find their entry. Matching is case insensitive (and ignores extra spaces). It returns only an exact match for the typed name and never shows a list of names.

Duplicates are expected (an uncle signs up separately from his wife). They are handled by the host merge, not prevented.

## Merging (host only)

Real case: Aunt and Uncle both sign up, both say a party of 6, both claim a dish.

- Host picks two or more entries and merges them into one.
- Host sets the final display name (for example, "Sue and Bob Smith") and the final party size. Sizes are **not** added automatically, because the 6 and 6 above is the same 6 people. Default to the largest number and let the host edit.
- Dishes claimed by either entry move to the merged entry.
- If both claimed the same item and only one is needed, the host sees the conflict and picks.
- **Browser memory keeps working after a merge.** Every browser that remembered either old entry now lands on the merged one, so both phones say "Welcome back" and show the same entry. The name lookup finds the merged entry by any of the original names.
- The merge is written to the change log with enough detail to rebuild the before state by hand. A one-click undo is a nice to have, not required.

## Host access

- One shared passphrase set as an environment variable. Entering it sets a session cookie. No user accounts.

## Out of scope for v1

- Accounts, logins, roles
- Invite lists
- Adult/kid split, dietary fields, free-text notes
- Sending emails or texts
- Multiple events
- Payments or cost splitting
- Seating charts
- Comments or chat between guests
- Closing sign-ups or RSVP deadlines (no open/close switch; the link just stays open)
- Calendar invites (maybe later, cheap as an .ics download)

## Non-functional

- Mobile first. Most guests will open this from a text message.
- Large tap targets, plain language, very few fields.
- Free to host (see tech direction).
- Basic spam protection (rate limit, honeypot field). Link is unlisted and sends `noindex`.
- Collect only first name, last name, and party size.

## Tech direction (decided)

- **Next.js, hosted on Railway.** Deploys from the GitHub repo.
- **Postgres, also on Railway**, in the same project as the app. One place, one dashboard. The app gets its connection string from a Railway variable. No Supabase and no Vercel.
- Design notes to carry into the design phase:
  - The browser never talks to the database directly. All reads and writes go through Next.js server code, so the visibility rules live in one place. Hidden names are never sent to the browser.
  - Browser memory is a random token stored in a cookie, mapped server-side to an entry. Merges repoint tokens to the merged entry.
  - Host passphrase is a Railway environment variable. Entering it sets a signed session cookie.
  - Data access library (for example Drizzle or Prisma) and migrations: decide in design.
  - The database is private to the Railway project. Only the app connects to it.

## Data model (rough)

- **Event**: title, date, time, address, host passphrase (env var, not stored)
- **Entry**: id, display name, party size, status (coming / cancelled), timestamps, merged into (optional)
- **Entry name**: entry id, first name, last name, lookup key (lowercase, trimmed, spaces collapsed, unique). A merged entry has one per original name. The same name cannot sign up twice, so that guest uses "Already signed up?".
- **Browser link**: hash of the cookie token to entry id, with an expiry. A merge repoints these.
- **Item**: id, label, quantity needed, added by (host or guest), sort order
- **Claim**: item id, entry id, quantity
- **Change log**: id, timestamp, actor (guest name or host), action, target, before, after

## Decisions on earlier assumptions

- No explicit "not coming" for first-time visitors. They just don't sign up.
- No free-text notes at all.
- Name lookup is first plus last name, case insensitive, with no pick-from-list.
- No closing of sign-ups.

## Event details (decided)

- Title: "Thanksgiving at Andrew and Isabella's"
- Date: Thursday, November 26, 2026
- Time: 5:00 pm
- Address: 123 Example St, Anytown, CA 90000
- Hosts: Andrew and Isabella Manzanero

## Decisions made during design

- Data access: Drizzle (lighter than Prisma, fits a small schema).
- Host list shows names for every dish. Guests who have not signed up only see Taken.
- Two guests cannot both hold the last unit of an item. The second sees Taken and picks something else. Merging two entries that claimed the same single item shows a conflict for the host to resolve.
- Browser memory cookie lasts until the day after Thanksgiving.
- Merge undo is not in v1. The change log has enough detail to rebuild by hand.
- Wrong passphrase, empty guest list, validation and rate-limit messages are designed (see `planning/design.md`).

## Next steps

1. Scaffold Next.js, tokens and fonts from the design.
2. Schema and migrations (Drizzle, Postgres on Railway).
3. Guest flow: landing, sign up, dishes, return visit, lookup, cancel.
4. Host flow: passphrase gate, guests, merge, bring list, log, event.
5. Spam protection, noindex, deploy to Railway.
