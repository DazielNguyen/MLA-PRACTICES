# Original MLA-C01 practice

The original pack is archived on this computer and is no longer available on the website.
The website contains only the imported ZIP and Udemy packs.
Existing original-pack progress remains in browser storage, Supabase and JSON backups.
The application excludes retired questions and their sessions from the study screens.

The original pack covers 44 topics. Related scenarios reinforce the same concepts; each question has one correct answer.
These are original practice scenarios, not official AWS exam questions or copies of CertSafari questions.
Each question includes a key concept, an explanation for every choice, and AWS references.
The reference review date is September 22, 2026. Service availability can change after that date.

## Published data

The canonical pack is `scripts/original-questions.json`. The importer keeps it in the local archive and exports validation shapes for old progress.

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

Open <http://127.0.0.1:5176>. This mode uses the same local question bank and disables Supabase.
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
