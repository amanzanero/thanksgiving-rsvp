# Thanksgiving RSVP: Scope

Status: draft for discussion. Nothing here is final until the open questions at the bottom are answered.

## Goal

A tiny website for one Thanksgiving. The host shares one link with family and friends. Guests RSVP for themselves, say how many people are coming, and pick what they will bring. The host can see everything and a log of changes.

This is personal use, one event, low traffic (probably under 50 people). Simple beats clever.

## Who uses it

- **Guest**: opens the shared link on a phone, RSVPs, can come back later to change it.
- **Host (you)**: sets up the event and the "please bring" list, and wants an audit trail.

## Core features (v1)

### 1. RSVP
- Guest enters their name, picks Yes or No, and a head count (including themselves).
- Optional note (allergies, "running late", etc.).
- Dishes they bring are chosen from the list (see 2), or they can add their own.

### 2. Bring list (public)
- Host predefines items, for example: turkey, mashed potatoes, rolls, pumpkin pie, drinks, ice.
- Everyone sees every item as **Taken** or **Still needed**, and who took it is shown on the item.
- A guest can claim an item, release it, or add a custom item ("Grandma's green bean casserole").
- Optional per item: how many are needed (for example, 2 pies).

### 3. Visibility rules (decided)
- **Bring list is public.** Anyone with the link sees each item as **Taken** or **Still needed**.
- **Names are hidden until you RSVP.** A visitor who has not RSVPed sees only "Taken", never who took it.
- **After you RSVP, you see who is bringing what.** (Assumption: this applies once you have RSVPed with Yes. See open question 1.)
- **Only the host sees the full guest list**, head counts, and notes. A guest sees their own RSVP and the names on the bring list, nothing more.

### 4. Come back and edit
- A guest can return and change or cancel their RSVP ("not coming anymore").
- No accounts and no passwords. See "Identity" below.
- Guest-facing names are first name plus last name.

### 5. Change log
- Every create, edit, cancel, claim, and release is recorded with a timestamp, who, and before/after values.
- Host can view the log on a simple page.

### 6. Host view
- Totals: confirmed, declined, total head count.
- Full guest list with notes.
- Merge RSVPs (see "Merging RSVPs").
- Bring list status.
- Change log.
- Edit the bring list and event details (date, time, address).

## Identity (decided): no accounts, honor system

The audience is not tech savvy, so there is no login, password, PIN, or link to save. The goal is to stop accidents, not to stop determined people. We are **not** solving for someone RSVPing as another person. The change log is the safety net.

**How a guest gets back to their RSVP:**
1. **Browser memory (automatic).** After RSVPing, the browser remembers which RSVP is theirs. Next visit: "Welcome back, Sue. Want to change your RSVP?" They do nothing to set this up.
2. **"Already RSVPed?" button (fallback).** For a new phone or cleared browser. They enter first name and last name (separate fields) to find their RSVP. Picking from a list is an option, see open question 4.

**Duplicates are expected and handled by the host, not prevented.** An uncle may RSVP separately from his wife. That is fine. The host can merge them (see Host view).

## Merging RSVPs (host only)

Real case: Aunt and Uncle both RSVP, both say a party of 6, both claim a dish.

- Host picks two or more RSVPs and merges them into one.
- Host sets the final name (for example, "Aunt Sue and Uncle Bob") and the final head count. It is **not** added automatically, because the 6 and 6 above is the same 6 people. Default to the largest number and let the host edit.
- All dishes claimed by either RSVP move to the merged RSVP. Notes are combined.
- If both claimed the same item and only one is needed, the host sees the conflict and picks.
- **Browser memory keeps working after a merge.** Every browser that remembered either old RSVP now lands on the merged one. So Aunt's phone and Uncle's phone both say "Welcome back" and show the same RSVP. Either of them can edit it. The "Already RSVPed?" lookup also finds the merged RSVP by any of the original names.
- The merge is recorded in the change log, with enough detail to understand what was combined.
- Undo: nice to have. At minimum the log holds the before state so the host can recreate it by hand.

## Host access

- Host view lives at a secret URL or behind a single shared passphrase set via environment variable. No user accounts.
- Proposed: one passphrase. Simple and not guessable like a plain hidden URL.

## Out of scope for v1

- Accounts, logins, roles
- Sending emails or texts (reminders, confirmations)
- Multiple events
- Payments or cost splitting
- Seating charts
- Comments or chat between guests
- Calendar invites (maybe later, cheap to add as an .ics download)

## Non-functional

- Mobile first. Most guests will open this from a text message.
- Loads fast, works without JavaScript heavy lifting where possible.
- Cheap or free to host.
- Data is small. Needs a real persistent store, but nothing big.
- Basic spam protection is enough (rate limit, maybe a honeypot field). Link is unlisted.
- Privacy: do not index (`noindex`), do not collect more than name, head count, note.

## Data model (rough, for scoping only)

- **Event**: title, date, time, location, notes, host passphrase hash
- **Guest/RSVP**: id, first name, last name, status (yes/no), party size, note, timestamps, merged into (optional)
- **Browser link**: browser token to RSVP id. A merge repoints all tokens from the old RSVPs to the merged one.
- **BringItem**: id, label, quantity needed, created by (host or guest), sort order
- **Claim**: item id, RSVP id, quantity
- **ChangeLog**: id, timestamp, actor (guest name or host), action, entity, before, after

## Open questions

1. **Who counts as "RSVPed"?** Does a "No" RSVP unlock the names on the bring list, or only a "Yes"? My lean: Yes only. Also, is it okay that names on the bring list reveal who is coming to other guests who have RSVPed? My lean: yes, that is the potluck norm.
2. **Head count detail**: Just a number, or do you want adults and kids separately (useful for portions and seating)?
3. **Dietary info**: Free-text note is enough, or a dedicated "allergies/dietary" field?
4. **Pick from a list?** You suggested letting guests pick their name from a list in the "Already RSVPed?" flow. A list of everyone who RSVPed would reveal who is coming, which conflicts with the visibility rules. Two ways around it: (a) skip the list and use first plus last name fields, (b) you preload your invite list, and guests pick from the invitees, which does not reveal who has RSVPed. My lean: (a) for v1, (b) later if lookups prove confusing.
5. **Host access**: Single passphrase okay?
6. **RSVP deadline**: Should RSVPs lock after a date, or stay open until the day?
7. **Guest-added items**: Can guests add their own dishes beyond your list, or only pick from yours?
8. **Hosting and stack preferences**: Any preference or constraints (for example, Vercel plus a small database, Cloudflare, or something you already use)? I would decide this in the design phase, but tell me now if you have a strong opinion.
9. **Event details**: Date, time, address, and any other info to show at the top of the page?

## Next steps

1. You answer the open questions, or tell me to go with my leans.
2. I update this doc to a final scope.
3. Move on to design: screens and flows, then data model and stack.
