# Demo video script: Housing Futures, with Horizon

AI for Housing Hackathon · AI Horizons 2026 · Track 3: Housing Typology, Equity & Climate Matchmaker

Target length: about 4:20, with a hard cap of 5:00. All four team members speak in sequence, each once, in one continuous block: Olaf opens, Meltem follows, then David, and Minghao closes. Each block starts with the speaker's first name so judges can follow the voice changes. The story runs community → values → lot → alternatives → trade-offs → action. A [trim] marker means the one sentence right after it can be dropped if the cut runs long.

Team name: TBD. Replace `[TEAM NAME]` in Olaf's first line once it's decided.

## Who does what

- **Olaf (0:00–0:50, about 130 words):** opening, the problem, who it's for, the five-step journey, search for Larimer. *Prep:* finalize the story and transitions.
- **Meltem (0:50–1:45, about 140 words):** Step 1, community needs, residents, police and smell context, data sources and privacy. *Prep:* check data sources, advisor framing, and limitations.
- **David (1:45–2:55, about 170 words):** Steps 2–4, stakeholder lens, editable weights, opportunity lot, housing ranking. *Prep:* operate and record the website; rehearse the exact clicks.
- **Minghao (2:55–4:20, about 220 words):** Step 5, why rankings differ, "Why not?", Horizon, 3D view and cost, decision-support statement, next steps, close. *Prep:* verify the API, the AI fallback, and the final technical setup.

Limitations are said inside each block, right where the relevant feature appears (area estimates in Meltem's block, draft zoning rules in David's, the cost benchmark and AI images in Minghao's), and Minghao closes with the decision-support statement. The "Prototype · draft rules" flag and the footer disclaimer stay on screen the whole time.

## How to record

1. **Minghao:** start the explanation server so Horizon can answer: `python3 src/server/app.py` (it needs the Groq key in `.env`). Then serve the app with `python3 -m http.server 8795 --directory src/app`. Ask Horizon one question to confirm it answers.
2. **David:** Chrome at about 1440 × 900, zoom 100%, bookmarks bar hidden, Do Not Disturb on, and no terminals or `.env` on screen. Reload `http://localhost:8795/` so the take starts clean on the County map.
3. **David** records one silent screen take following the "On screen" cues, pausing a beat after every click. Keep each block's screen time close to its timing below.
4. Each speaker records their whole block in one go while watching their stretch of the screen take. Leave about half a second of silence at the start and end.
5. **David** lays the four audio clips over the screen take in order, trims silence, and checks the total is under 5:00.

Alternative if time is short: a Zoom call with David sharing the screen and each speaker unmuting in turn, recorded in one take.

## Delivery

- Talk it, don't read it. Say it the way you'd explain the tool to a planner sitting next to you. Small changes to the wording are fine if they sound more like you; keep the numbers exact.
- The four **bold** lines carry the argument. Slow down slightly on each one and leave a short beat afterward while the matching screen is visible:
  - David: "Weights change the order of the options. They never change the facts." (weight sliders on screen)
  - David: "Same lot, same data, different values." (the duplex has just moved to #1)
  - Minghao: "So this is a values call, not a data-driven winner." (robustness lines on screen)
  - Minghao: "The math ranks. Horizon explains." (Horizon's answer on screen)
- At about 650 words in 4:20 there's room to breathe. If a take runs long, drop the [trim] sentence before speeding up.
- Smile on the first line of your block; it carries into your voice.

---

## Olaf · 0:00–0:50 · Opening and the problem

**On screen:** Housing Futures open on the full Allegheny County map, cursor still. On "Pittsburgh doesn't just need more housing," slowly zoom toward the City. On "Let's start in Larimer," type "Larimer" in the search bar and press Enter; the map zooms in.

**Voiceover:**
Hi, I'm Olaf. We're [TEAM NAME], and this is our submission to the AI for Housing Hackathon, part of AI Horizons 2026 in Pittsburgh. We're in Track 3, Housing Typology, Equity and Climate, and our team is Meltem, David, Minghao and me.

Pittsburgh doesn't just need more housing. It needs different kinds of housing. The City's own Housing Needs Assessment estimates demand for about 1,900 missing-middle rental homes, yet buildings with four or more homes are allowed on only 23 percent of city land. So planners, community development corporations and small developers keep hitting the same question: on this lot, which housing type makes sense, what does each option give up, and what would have to change? Housing Futures helps answer that in five steps. Let's start in Larimer.

## Meltem · 0:50–1:45 · Step 1: What does this community need?

**On screen:** The "What does Larimer need?" panel. Hover over the families card, then the vacancy card. Scroll slowly through "Who lives here." Stop on the police and Smell Pittsburgh context card.

**Voiceover:**
I'm Meltem. Step one starts with the community, not the zoning code. That was the biggest piece of feedback from our faculty advisors: lead with what a neighborhood needs, not with what's prohibited. So before anyone talks about buildings, we look at what Larimer needs. A quarter of residents are kids, 28 percent of homes sit vacant, and 70 percent of households rent. Every flag shows its source and the rule that triggered it. These are neighborhood estimates from the Census, with margins of error, not facts about any one household. Police and Smell Pittsburgh reports are included only as context. They never affect the ranking or label a neighborhood. Everything comes from public County, City and Census data, down to all 142,000 parcels in the City. We don't expose owner names or personal mailing information in the interface.

## David · 1:45–2:55 · Steps 2–4: lens, lot, ranking

**On screen:**
1. Click Next to Step 2. Click the Community lens. Drag one slider a little so the other weights rebalance to 100.
2. Click Next to Step 3. Pause on the opportunity layer counts. Click "Or open an example lot in Larimer"; the parcel card appears.
3. Step 4 opens. Point at #1 Townhouses and #2 Duplex (both 78/100), then Cottage court ("Not allowed") and Garage ADU ("Needs changes"). Click the Policy maker tab: Duplex moves to #1. Click Community again.

**Voiceover:**
I'm David. Step two asks who you're planning for: a policy maker, the community, a developer, an architect or an investor. Each lens is a starting set of ten weights that always add up to 100, and every weight is editable. **Weights change the order of the options. They never change the facts.**

Step three shows where homes could realistically go. In Larimer there are 764 vacant lots and 490 publicly owned parcels. Let's take a City-owned vacant lot on Larimer Avenue, about 5,400 square feet, two minutes from a bus. Because it's public land, it creates an opportunity to preserve long-term affordability.

Step four ranks housing types for that lot. Through the community lens, townhouses and a duplex tie at 78. A cottage court doesn't fit, and a garage apartment would need a rule change. These checks use draft zoning rules we haven't verified yet, and the app says so. Now switch to a policy maker's priorities, and the duplex moves to the top. **Same lot, same data, different values.**

## Minghao · 2:55–4:20 · Step 5: trade-offs, Horizon, and close

**On screen:**
1. Click "Next: review trade-offs." Show the 3D massing and performance tiles, then scroll to the cost explorer and nudge the cost per square foot.
2. Scroll to "Why this order?" and hold on the robustness lines.
3. Click the "#4 Garage ADU" chip at the top; the right column shows "Backyard homes not allowed yet" and "City Council · Bill 2025-1545 (pending)."
4. Scroll up and click "Ask Horizon to explain this trade-off." The panel opens with the current context and the answer arrives.
5. Close Horizon. Point at the "Prototype · draft rules" flag and the footer disclaimer, then zoom the map out slowly and end on the Housing Futures title.

**Voiceover:**
I'm Minghao. Step five shows the trade-offs. Here's the building in 3D, its transit access and open space, and a cost explorer where every assumption is editable. The cost starts from a national benchmark, so treat it as an illustration, not a local quote. Same with the images: they're AI-generated, not designs for this lot.

[trim] Here's the part we're proudest of. Across fifteen hundred random priority mixes, townhouses and the duplex each come out on top about a third of the time. **So this is a values call, not a data-driven winner.** For the garage apartment, "Why not?" shows the key barrier our prototype identifies: backyard units aren't allowed citywide yet, and a pending City Council bill could change that.

And this is Horizon, our planning copilot, a nod to AI Horizons. Horizon only explains results already computed by the dashboard, and its numerical claims are checked before they're shown. **The math ranks. Horizon explains.**

This is decision support, not legal, zoning or financial advice. A community group can walk into a neighborhood meeting seeing which parts of the decision come from data, which come from values, and which rules may be standing in the way. Next, we'll verify the zoning rules with City Planning, add infrastructure data, and pilot this with a Larimer community partner. Thanks for watching.

*If Horizon doesn't answer during the take, say instead of its paragraph:* And this is Horizon, our planning copilot. When its local server isn't reachable, it says so, and the dashboard's own numbers still stand.

---

## How the script covers the rules

Handbook video rules:

- 3 to 5 minutes: planned at about 4:20 (about 650 spoken words).
- Say the hackathon name and who we are: Olaf's opening, which names the whole team.
- Show the working tool, not slides: everything after the opening line is a live screen recording.
- Be honest about what works and what is mocked: draft zoning rules (David), area estimates (Meltem), cost benchmark and AI images (Minghao), the Horizon fallback line, and the on-screen "Prototype · draft rules" flag.
- Decision support only, with a limitations statement: Minghao's close says it out loud, the footer shows it throughout, and the full statement is `docs/limitations.md`.
- Recorded during the weekend: record before 11:59 p.m. ET on Sunday, September 27.
- Keep it public: upload to YouTube as **Public**, not Unlisted, and open the link in an incognito window before submitting.
- No late submissions: the form closes at 11:59 p.m. ET. Aim to have the video uploaded by 10:30 p.m.
- After the deadline only small bug fixes are allowed while recording, and no new features.
- Never show API keys or `.env` on screen.

Judging criteria:

- Problem value: Olaf (Housing Needs Assessment figures, the planner's question).
- User fit: Olaf (planners, community development corporations, small developers), David (five lenses), Minghao (community group in a neighborhood meeting).
- Technical execution: Meltem, David and Minghao, all live.
- Data and AI integrity: Meltem (public sources, context-only safety data, no personal data), Minghao (number-checked AI, decision-support framing).
- Actionability: Minghao (which parts of a decision come from data, which from values, and which rules may stand in the way).
- Continuation: Minghao (City Planning verification, infrastructure data, a Larimer pilot).

Track 3 success criteria:

- Compare at least two scenarios for a real place: David, Step 4.
- See why they rank differently: Minghao, robustness and Horizon.
- Change the normative weights: David, Steps 2 and 4.
- Tell data-driven conclusions from value judgments: Minghao, robustness.

## Facts used in the script, and where to check them

- 1,900 missing-middle rental homes and 23% of city land: City of Pittsburgh Housing Needs Assessment 2022, pp. 19 and 28 (`docs/references.md`, C1).
- Larimer figures (26% under 18, 28% vacant homes, 70% renters), opportunity counts (764 vacant lots, 490 public parcels) and the Larimer Avenue lot (5,404 sq ft, City-owned, 2 minutes to the bus): shown in the app.
- Townhouses and duplex at 78/100 under the Community lens; the duplex moves to #1 under Policy maker; townhouses win 35% and the duplex 37% of all 1,500 sampled weight mixes. The sampling is seeded, so these numbers are the same on every take.
- 142,305 City parcels: `src/app/README.md`.
