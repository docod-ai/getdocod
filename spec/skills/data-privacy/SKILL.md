---
key: data-privacy
name: Data Privacy
description: Personal data as a liability — legal basis, minimization, retention, anonymization vs pseudonymization, right to erasure and where the data spreads. Use when modeling, when promising privacy, when controlling access and when instrumenting logs.
layer: 2
neutral: true
owner: null
used_by: [data-design, security-design, observability, prd]
requires_capabilities: []
---

# Data Privacy

**Personal data is not an asset. It is a liability with a deadline.**

Every personal field you store is an obligation: to protect it, to justify it, to erase it when asked, and to answer for it if it leaks. Storing "just in case" is not caution — it is taking on a liability to pay a debt that might never have been collected.

Four agents touch this from different angles: `data-design` (stores and erases), `security-design` (protects and controls access), `observability` (is where data leaks without anyone deciding to leak it) and `prd` (promises the privacy the other three will have to deliver). Without a common rule, each has its own — and the log's rule wins, because it is the one nobody reviews.

---

## Anonymize ≠ pseudonymize

**It is the most common mistake and the most expensive one, because the two words look like synonyms and are not.**

| | Anonymization | Pseudonymization |
|---|---|---|
| Reversible? | **no**, by anyone | **yes**, with the key |
| Still personal data? | **no** | **yes** |
| Needs a legal basis? | no | **yes** |
| Satisfies the right to erasure? | yes | **no** |
| Example | truncate the IP octet; aggregate age into ranges | replace `user_id` with a hash |

Replacing `user_id` with a hash does **not** take the data out of the law's scope. If any path back to the person exists — the key, the mapping table, or a join with another dataset — the data remains personal, and every obligation still applies.

The test is harsh: **if you can reverse it, someone who gets your data can too.** And the "join with another dataset" defeats a lot of naive anonymization: ZIP code + date of birth + gender identifies a good share of a population. Removing the name anonymizes nothing.

---

## Legal basis: without it, no collection

Every personal field declares **why you are allowed to have it**. This is not legal formality — it is what decides retention and what happens when the data subject requests deletion.

| Field | Classification | Legal basis | Retention | Disposal |
|---|---|---|---|---|
| email | personal | contract performance | account lifetime + 6m | erase |
| tax document | sensitive | legal obligation | statutory period | erase after the period |
| IP address | personal | legitimate interest (security) | 6 months | anonymize (truncate) |
| purchase history | personal | legal obligation | statutory period | pseudonymize |

**Different bases give the data subject different powers.** Consent can be withdrawn — and then you erase. A legal obligation cannot be withdrawn — and then you do not erase, even if asked. If you do not know the basis, you do not know how to answer a deletion request. Finding that out at request time is too late.

**Minimization is the only defense that always works:** the data you did not collect does not leak, needs no legal basis, needs no erasure and does not appear in the incident report. A "might be useful someday" field is pure risk with hypothetical benefit.

**"Keep forever" is not a retention policy.** It is the absence of one, written in a way that looks like a decision.

---

## Where the data **also** lives

The question that makes the right to erasure work or makes it a lie. You erase it from the table — and it lives on in:

- **read replica** and **backup**
- **data warehouse** and every analytics pipeline
- **application log** and **audit log** ← the forgotten one, almost always
- **cache** and **search index**
- **sent email**, notification, CSV export someone downloaded
- **ML model** trained on the data

**Soft delete does not satisfy the right to erasure.** The row is still there with the flag set. That is hiding, not erasing — and the difference is exactly what the law demands.

**Backup** is the honest, uncomfortable case: it contains the data and you are not going to rewrite backups. The real answer is its expiration period — and that period must be **written down and defensible**, not discovered during the audit.

**The log is the most common leak because nobody decides to leak.** Nobody writes "I will log the SSN". Someone writes `log.info(f"processing {user}")` and the whole object serializes. The data ends up in a system with different retention, different access control, and one that nobody includes in the disposal process. That is why `observability` uses this skill.

---

## Design questions

- Which fields are personal data? What is the **legal basis** for each?
- Is there **sensitive** data (health, biometrics, religion, affiliation, financial)? It has stricter rules.
- Retention **required by law** vs desired by the business — which overrides which, field by field?
- How do we satisfy an erasure request **today**? Has anyone done the end-to-end exercise?
- Does this data feed a model or analytics pipeline? What happens to it there?
- Does the log carry PII? What is **its** retention?

**Legal retention overrides the right to erasure — but only for the fields the law requires, not the whole account.** It is the favorite excuse for erasing nothing: "we are required to keep it for 5 years". You are required to keep the tax document. Not the address, the phone number, the browsing history and the profile photo.

---

## Test

1. Does every personal field have a declared legal basis?
2. Is any field collected without a clear purpose? (then do not collect it)
3. Is what you call "anonymized" reversible? Then it is pseudonymized.
4. An erasure request arrives today — can you list **all** the places the data lives?
5. Is soft delete being sold as erasure?
6. Does the log carry personal data? With what retention?
7. Does "keep forever" appear anywhere?
