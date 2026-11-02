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

### 3. Guest list visibility (private-ish)
- Rule from you: only the host sees who is coming overall. A guest sees only their **own** RSVP.
- The bring list is the one public thing. Seeing "taken by Sam" on an item is a deliberate exception. See open question 1.

### 4. Come back and edit
- A guest can return and change or cancel their RSVP ("not coming anymore").
- No accounts and no passwords. See "Identity" below.

### 5. Change log
- Every create, edit, cancel, claim, and release is recorded with a timestamp, who, and before/after values.
- Host can view the log on a simple page.

### 6. Host view
- Totals: confirmed, declined, total head count.
- Full guest list with notes.
- Bring list status.
- Change log.
- Edit the bring list and event details (date, time, address).

## Identity: the "no crazy permissions" question

This is the main design decision. Options:

| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Browser token | On first RSVP, store a random token in the browser (localStorage or cookie). That token lets them edit later. | Zero friction, no typing | Lost on new device or cleared cookies |
| B. Private edit link | After RSVP, show a unique link (`/rsvp/<secret>`) to bookmark or text to themselves | Works on any device | Guests must save the link |
| C. Name match | Guest types the same name again to edit | Dead simple | Anyone can edit anyone's RSVP, typos create duplicates |
| D. Email magic link | Emails a link | Standard | Needs email sending, more setup |

Proposed: **A plus B**. Browser token by default, and also show the private edit link on the confirmation screen as a backup. Host can edit anything. The change log covers abuse, which fits the "just some logging" idea.

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
- **Guest/RSVP**: id, name, status (yes/no), party size, note, edit token, timestamps
- **BringItem**: id, label, quantity needed, created by (host or guest), sort order
- **Claim**: item id, RSVP id, quantity
- **ChangeLog**: id, timestamp, actor (guest name or host), action, entity, before, after

## Open questions

1. **Public vs private**: You said the bring list is public (what is taken and by whom), but only you see who is coming. Is it okay that "Sam is bringing rolls" reveals Sam is coming? Or should it show only "Taken" with no name for other guests? My lean: show names, since that is how a potluck sign-up usually works and it helps people coordinate.
2. **Head count detail**: Just a number, or do you want adults and kids separately (useful for portions and seating)?
3. **Dietary info**: Free-text note is enough, or a dedicated "allergies/dietary" field?
4. **Edit identity**: Are you happy with browser token plus private link, or would you prefer something simpler like name match?
5. **Host access**: Single passphrase okay?
6. **RSVP deadline**: Should RSVPs lock after a date, or stay open until the day?
7. **Guest-added items**: Can guests add their own dishes beyond your list, or only pick from yours?
8. **Hosting and stack preferences**: Any preference or constraints (for example, Vercel plus a small database, Cloudflare, or something you already use)? I would decide this in the design phase, but tell me now if you have a strong opinion.
9. **Event details**: Date, time, address, and any other info to show at the top of the page?

## Next steps

1. You answer the open questions, or tell me to go with my leans.
2. I update this doc to a final scope.
3. Move on to design: screens and flows, then data model and stack.
