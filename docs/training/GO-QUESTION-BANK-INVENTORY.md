# Pulse GO legacy question bank — import inventory

This inventory maps the supplied `Pulse Go Questions (2).docx` to the existing
legacy source files. It is source material for a future, reviewed import into
the canonical Supabase-backed GO product. The legacy JavaScript question arrays
must not be reconnected to live gameplay or treated as an authorization source.

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

## Safe activation sequence

1. Training/business owner reviews question accuracy, especially compliance,
   eligibility, transfer, and disposition rules. Resolve any outdated or
   ambiguous wording in both languages. The source document and arrays are not
   publication approval.
2. Define server-owned mode and difficulty classification on the canonical
   content model, with authorization, audit, published-version immutability,
   and revision-pinned Practice/Hosted reads. Do not infer it from a title or
   browser-submitted label.
3. Build a bounded, idempotent import into **drafts** in a disposable/local
   database first. Preserve each source ID in import provenance and verify all
   counts, language pairs, options, correct answers, and explanations.
4. Repeat in Pulse Preview only with explicit checkpoint approval. Review the
   16 groups in Studio, then publish approved games/versions through the normal
   server-authorized path. Do not seed Pulse Dev or Production from this file.

Current Studio supports only Classic Quiz as an enabled game mode, with a
10-question game definition. The remaining legacy modes are intentionally
marked coming soon. This inventory does not enable them or import questions.
