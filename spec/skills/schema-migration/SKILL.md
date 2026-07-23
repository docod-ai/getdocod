---
key: schema-migration
name: Schema Migration
description: Changing the shape of the data without losing the data or taking down the system. Expand/contract, mandatory rollback, batched backfill, compatibility with the previous application version, and the signs of a dangerous migration. Use when specifying, executing, reviewing or testing any schema change.
layer: 2
neutral: true
owner: null
used_by: [data-design, task-executor, code-review, qa-executor]
requires_capabilities: []
---

# Schema Migration

**Buggy code is fixed with a deploy. Corrupted data is not.**

That is the asymmetry that justifies this skill's existence. All of modern engineering is built on the premise that being wrong is cheap: commit, test, rollback, deploy again. Data is the part where that premise is false. An executed `DROP COLUMN` has no `git revert`.

Four agents touch the same migration: one specifies it (`data-design`), one executes it (`task-executor`), one reviews it (`code-review`) and one tests it (`qa-executor`). If the playbook lives only with the one who specifies, the one who executes does the `DROP COLUMN` in the same PR — and then it does not matter how good the document was.

---

## The rule that solves almost everything: expand / contract

**Never make a breaking change in one step.** The destructive change and the creation of the replacement never coexist in the same deploy.

Renaming `nome` → `full_name` is **six independent deploys**:

| # | Step | What | Reversible? |
|---|---|---|---|
| 1 | **Expand** | adds `full_name`, nullable, no expensive default | yes — an empty column bothers no one |
| 2 | **Dual write** | app writes to **both** | yes — go back to writing only the old one |
| 3 | **Backfill** | copies the history, **in batches** | yes — the old one remains correct |
| 4 | **Dual read** | app reads from the new one, with fallback to the old | yes — remove the fallback, inverted |
| 5 | **Stop old write** | app writes only to the new one; removes fallback | yes, as long as the old one exists |
| 6 | **Contract** | removes `nome` | **no. This is where the net ends.** |

Weeks can pass between step 1 and step 6. **That is correct.** Haste between these steps is what turns maintenance into an incident.

Step 6 is the only irreversible one — and it is only safe because the previous five proved, in production, that nobody depends on the old column anymore. Jumping straight to 6 is betting that you know every reader of your database. You do not: there is the report someone built, the overnight job, the support team's manual query.

---

## The migration runs with the **old** application live

The point almost everyone forgets, because in dev it never happens.

During the deploy there is a window — seconds or minutes — in which version N-1 and version N are running **at the same time**. If your migration assumes only the new one exists, the old one breaks in that window. And if the deploy is rolled back, the old one is the one that stays.

**Every migration must be compatible with the previous version of the application.** This is not advice: it is what makes the six-step sequence mandatory rather than elegant.

---

## Rollback: without it, it does not go in

**A migration without a rollback script does not go to production.** This is not a process preference — it is the difference between a 10-minute problem and a 10-hour one at 3 a.m.

And "rollback" means a script **written and tested**, not "we restore the backup". Restoring a backup loses everything written since the migration. That is not rollback, that is accepting data loss.

When rollback is genuinely impossible (step 6 is the classic case), that must be **written down and approved** — not discovered during the incident. An irreversible migration is a decision, and a decision has an owner.

---

## Backfill: batching is not optimization

An `UPDATE` on the whole table locks the table. While it runs — and it runs for much longer than you estimated — nobody writes. It is complete unavailability caused by a line of SQL that looked harmless.

**Backfill goes in batches**, with a defined rate and a pause between batches. What must be specified:

- **batch size** and the **pause** between them
- **total time estimated with production volume**, not dev's
- what happens if it is **interrupted midway** — is it resumable? idempotent?
- whether concurrent writes during the backfill produce new rows that also need backfilling

> **A migration that runs in 2s in dev can run in 40min with 50M rows.** And it is the 40-minute one that locks production. Testing a migration with a 10-row fixture is not testing the migration — it is testing the syntax.

---

## Signs of a dangerous migration

Review signals. Any of them in the PR is reason to stop and ask:

| 🔴 | Why |
|---|---|
| Removal of the old column in the same PR that adds the new one | that is expand and contract together. The net does not exist. |
| `UPDATE` without a filter clause and without batching | locks the table for an indefinite time |
| New column already `NOT NULL` with an expensive default, on a large table | rewrites the whole table in several engines. Becomes downtime. |
| Blocking index creation on a hot table | locks writes for the entire creation |
| No rollback script | there is no way back |
| Tested only with fixture data | the real execution time is unknown |
| `NOT NULL` added together with the column | those are two stages: nullable → backfill → constraint |

**An index on a large table needs the engine's non-blocking mode** (in Postgres, `CREATE INDEX CONCURRENTLY`; other engines have an equivalent or do not — if they do not, it is a maintenance window, and that has to be stated). A blocking index on a hot table is unavailability with the name of an optimization.

---

## Pre-migration checklist

- [ ] Rollback script written **and tested**
- [ ] Time estimated **with production volume**
- [ ] Batched backfill, with rate and resumption defined
- [ ] Compatible with the N-1 application running
- [ ] Indexes created in non-blocking mode — or a declared window
- [ ] Recent backup **restored**, not merely existing
- [ ] No destructive step in the same deploy as the constructive one
- [ ] Lock and replica-lag monitoring during execution

The backup item deserves the emphasis: **a backup that has never been restored is not a backup, it is hope.** The time to discover it is corrupted is not after the migration that went wrong.

---

## Outside the relational model

An engine without a schema does not eliminate the migration — **it moves it into the application**. The old document stays in the database with the old shape, and now the code carries both formats, indefinitely, with nobody tracking it.

The sequence is the same, under different names: write the new field, backfill the old documents, read from the new one, stop writing the old one, remove. The difference is that **nothing forces you** — so stage 6 never happens, and the debt stays in the `if` that handles the 2019 format.

"No migrations" almost always means "untracked migrations".

---

## Test

1. Is the destructive change in the same deploy as the constructive one? → stop.
2. Is there a rollback script, written and tested? If it is impossible, is that declared and approved?
3. Was the time estimated with production volume?
4. Does the N-1 application survive this migration?
5. Is the backfill batched, resumable, with a defined rate?
6. If this is interrupted halfway, what state is the database left in?
7. Who else reads this column besides the application? (report, job, support query)
