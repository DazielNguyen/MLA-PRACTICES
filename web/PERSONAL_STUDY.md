# Original MLA-C01 practice

The website contains 594 questions: 242 imported questions and 352 original practice questions.
Each original question displays **Tự biên soạn**. IDs 1001–1352 remain unchanged from the personal pack.

Select **MLA-C01 · 352 câu tự biên soạn** in practice or exam setup to study the new questions.
The four **Tự biên soạn · Domain** filters select individual domains.
Flashcards and the question library have a **Nguồn câu hỏi** selector.

The original pack covers 44 topics. Related scenarios reinforce the same concepts; each question has one correct answer.
These are original practice scenarios, not official AWS exam questions or copies of CertSafari questions.
Each question includes a key concept, an explanation for every choice, and AWS references.
The reference review date is September 22, 2026. Service availability can change after that date.

## Published data

The canonical pack is `scripts/original-questions.json`. The importer appends it to the existing MLA bank without renumbering questions.

```sh
python3 scripts/import-questions.py
```

The importer also rebuilds the local combined Markdown and Quizlet exports in `../output/merged/`.
The web deployment includes MLA content only. MLS content stays in the archive.

Run Supabase migrations `001`, `002`, and `003` in order on a new project.
Existing projects with `002` need only `003_original_question_bank.sql` to support four-digit question IDs.
The migration preserves saved records and access policies.

## Study on this computer

Run from the `web` directory:

```sh
npm run study
```

Open <http://127.0.0.1:5176>. This mode uses the same 594 questions and disables Supabase.
Progress stays in the browser. Use the application's JSON backup to transfer it to the website.
A production build uses the same bank with the configured Supabase connection.

## Markdown and Quizlet

To generate exports for the 352 original questions:

```sh
python3 scripts/build-personal-bank.py
```

The command writes these files to the ignored `local-study/` directory:

- `MLA_ORIGINAL_352.md`: questions, answers, explanations, and references.
- `QUIZLET_ORIGINAL_352.md`: one card per line, with a tab between question and answer.
- `original-352.json`: the original pack.
- `questions.json`: the combined bank.
- `audit.json`: counts and a checksum of the published bank.

For Quizlet, select a tab between term and definition, and a new line between cards.
Local authoring drafts and cached AWS pages stay excluded from Git and Vercel.
