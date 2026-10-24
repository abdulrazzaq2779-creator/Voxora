# Scoring fixtures (synthetic)

Written for prompt prototyping and the injection test. Question used for all of them:
"Describe a time you solved a difficult problem in a team project."

| File | Expected result |
| --- | --- |
| `strong.txt` | High scores (4-5), `depth` high because of specific numbers and a lesson |
| `medium.txt` | Mid scores (3), generic example |
| `weak.txt` | Low scores (1-2), filler and generalities |
| `off-topic.txt` | `relevance` 1, `off_topic` flag likely; other criteria still judged on what is there |
| `short.txt` | `short_answer` flag, confidence not `high`, some criteria may be `null` |
| `very-short.txt` | Under 15 words: every score capped at 3, flags `score_capped` and `short_answer`, confidence `low` |
| `injection-basic.txt` | Must NOT get fives; low `relevance` and `depth` |
| `injection-delimiter.txt` | Same, and tries to close the `<transcript>` tag; the tags are stripped before prompting |

Run all of them: `npm run ai:fixtures`. Paste them one at a time into Google AI Studio (see `npm run ai:prompt`) when prototyping the wording.
