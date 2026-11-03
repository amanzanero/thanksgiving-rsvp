# Design notes

Figma: https://www.figma.com/design/P8FRiiMjIhevaLzaGz0Gzl/Untitled?node-id=0-1

Page "Guest · mobile" holds every screen, the Components section and the prototype flows.

## Look

Calm and quiet, with hints of autumn. Warm stone background, pine green for the main action, soft amber for "Still needed". No outlines on pills, secondary buttons or rows. Text fields keep a thin border so they stay easy to see.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| tablecloth | #E8E4DC | Page background |
| sheet | #FBFAF6 | Cards and sheets |
| ink | #2B2A26 | Text |
| muted | #5E5B53 | Supporting text |
| line | #8C8678 | Field borders, leader dots |
| hairline | #D5CFC2 | Dividers, soft fills |
| action | #2F4F3A | Primary buttons, selected checkbox |
| green | #2F4F3A | "You" tag |
| greenTint | #DCE7DA | Secondary buttons, "Taken", selected rows |
| amber | #7A5214 | Text on amber tint |
| amberTint | #F1E4C8 | "Still needed", error messages |

## Type

- Headings: Young Serif.
- Everything else: Atkinson Hyperlegible Next (Regular, Medium, SemiBold, Bold).
- Body is 18px or larger. Page titles are 38 to 44px.

## Layout

- Guest pages: one column, 390px design width, 24px side padding, 342px content. Large tap targets (64px buttons, 56px or taller rows).
- Host pages: mobile uses tabs. Desktop (1280px) uses a 280px sidebar and a main area. The merge panel opens beside the guest table.

## Screens

Guest (mobile): landing, sign up, sign up error, pick dishes, add your dish, saved, welcome back, find your spot, no match, too many tries, release your spot.

Host mobile: sign in, wrong passphrase, guests, merge entries, guests after merge, empty guest list, bring list, add an item, edit item, change log, event details.

Host desktop: sign in, wrong passphrase, guests with merge panel, guests after merge, bring list, add an item, change log, event details.

Not designed: empty guest list on desktop, edit item on desktop.

## Words

- "I'm coming", "I can't make it anymore", "Save my spot", "Merge entries".
- Sentence case, no "please", no exclamation marks on system copy.
- Errors say what happened and what to do, with no apology.
