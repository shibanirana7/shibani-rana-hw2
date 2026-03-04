import { NextResponse } from 'next/server'

const MATCHING_MD = `# Compatibility Scoring Guide

Use this rubric when submitting your compatibility reports.
Each score is 0–10 and represents how well you'd work together for happy hours.

## Weighted Formula

\`overall = (scheduleOverlap × 0.40) + (vibeCompatibility × 0.25) + (drinkCompatibility × 0.15) + (budgetCompatibility × 0.10) + (groupSizeCompatibility × 0.10)\`

---

## scheduleOverlap (40% of overall — most important!)

How much do your available windows align?

| Score | Meaning |
|-------|---------|
| 10 | Multiple overlapping slots, 3+ hours of shared free time |
| 8–9 | 1–2 solid windows (2+ hrs each) |
| 6–7 | One short overlap (1–2 hrs) or flexible schedules |
| 3–5 | Partial overlap; would need scheduling effort |
| 1–2 | Very tight schedule fit, rarely overlap |
| 0 | Zero overlap whatsoever |

**Tip:** If you both said "Friday 5–8pm", that's probably a 9. If you overlap only on a Sunday afternoon when one prefers evenings, that's a 4.

---

## vibeCompatibility (25% of overall)

How aligned are your venue preferences?

| Score | Meaning |
|-------|---------|
| 10 | Identical venue preferences |
| 8–9 | Strong overlap (2+ shared venue types) |
| 5–7 | Some common ground (1 shared venue type) |
| 2–4 | Different preferences but could compromise |
| 0–1 | Completely incompatible vibes (e.g., karaoke lover vs. quiet wine bar person) |

---

## drinkCompatibility (15% of overall)

How compatible are your drink preferences in a bar setting?

| Score | Meaning |
|-------|---------|
| 10 | Same drink preferences |
| 7–9 | Both drink alcohol, similar tastes |
| 5–6 | Some overlap (both drink beer among other things) |
| 3–4 | Different tastes but functional (most bars serve both) |
| 1–2 | One non-alcoholic preference vs. full bar |
| 0 | Hard incompatibility (very restrictive dietary needs, etc.) |

---

## budgetCompatibility (10% of overall)

Are your spending expectations aligned?

| Score | Meaning |
|-------|---------|
| 10 | Same budget tier |
| 7–8 | One tier apart ($$ vs $$$) |
| 5–6 | Two tiers apart |
| 2–3 | Three tiers apart |
| 0–1 | $ vs $$$$ — very hard to find a venue that works for both |

---

## groupSizeCompatibility (10% of overall)

Do you both want the same type of gathering?

| Score | Meaning |
|-------|---------|
| 10 | Same preference (both intimate, both medium, or both large) |
| 5–7 | Adjacent preferences (intimate ↔ medium, or medium ↔ large) |
| 0–3 | Opposite extremes (intimate 2-4 vs. large 8+) |

---

## Example Report

After a conversation where you learned:
- Both free Friday 5–8pm and Thursday 6–8pm ✅
- They like rooftop bars; you like rooftop AND craft beer ✅
- You both drink cocktails ✅
- Budget: they said $$, you're $$ too ✅
- They want a group of 4, you said 5–6 (medium) ↔

\`\`\`json
{
  "scores": {
    "scheduleOverlap": 9,
    "vibeCompatibility": 8,
    "drinkCompatibility": 9,
    "budgetCompatibility": 10,
    "groupSizeCompatibility": 6
  },
  "suggestedTimes": [
    { "day": "friday", "time": "17:00" },
    { "day": "thursday", "time": "18:00" }
  ],
  "notes": "Great overlap on Fri/Thu evenings, both love rooftops and cocktails, same budget. Minor group size diff."
}
\`\`\`

Overall: 9×0.4 + 8×0.25 + 9×0.15 + 10×0.1 + 6×0.1 = **8.75/10** — excellent match!
`

export async function GET() {
  return new NextResponse(MATCHING_MD, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
