# Pulse GO legacy question bank — import inventory

This inventory maps the supplied `Pulse Go Questions (2).docx` to the existing
legacy source files. The bank is staged as **16 unpublished drafts / 640
questions in Pulse Preview only**. The legacy JavaScript question arrays must
not be reconnected to live gameplay or treated as an authorization source.

| Mode | Source | English | Spanish | Grouping |
| --- | --- | ---: | ---: | --- |
| Classic Quiz | `src/go/questions/classicQuestions.js` | 120 | 120 | 40 each: Easy, Medium, Advanced |
| Valid or Invalid XFER | `src/go/questions/validInvalidQuestions.js` | 40 | 40 | One mode per language |
| Dispose It | `src/go/questions/disposeItQuestions.js` | 40 | 40 | One mode per language |
| Eligible or Not Eligible | `src/go/questions/eligibleQuestions.js` | 40 | 40 | One mode per language |
| Objection Battle | `src/go/questions/objectionBattleQuestions.js` | 40 | 40 | One mode per language |
| Certification Mode | `src/go/questions/certificationQuestions.js` | 40 | 40 | One mode per language |
| **Total** | | **320** | **320** | **16 mode/language/difficulty groups** |

The document's 640 numbered questions match the 640 existing source questions
in order: prompts, answer options, correct answers, and explanations. Existing
IDs are unique. Of these, 480 have four options and 160 have two. The correct
answer position is heavily skewed: A 328, B 226, C 82, D 4. Review and
reorder options where appropriate before presenting a randomized assessment;
preserve the answer mapping whenever options are changed.

## Review and activation boundary

1. Training/business owner reviews question accuracy, especially compliance,
   eligibility, transfer, and disposition rules. Resolve any outdated or
   ambiguous wording in both languages. The source document and arrays are not
   publication approval.
2. Server-owned mode and difficulty are stored in `go_question_bank_groups`.
   Its read RPC checks Studio authorization and its trigger prevents publication
   of bank drafts until a separate review checkpoint changes that policy.
3. `scripts/go-question-bank/build-preview-import.mjs` generated the bounded,
   idempotent import. It passed a disposable local rehearsal twice, including
   original source IDs, answer options, answer keys, and explanations.
4. Pulse Preview received only the generic migration and 16 review drafts.
   Review them in Studio before a future, separately authorized publication.
   Do not seed Pulse Dev or Production from this import.

Current GO supports only Classic Quiz as an enabled game mode, with a
10-question game definition. The remaining legacy modes are intentionally
marked coming soon. Staging the bank does not enable any of them, and no bank
draft is playable while it remains unpublished.
