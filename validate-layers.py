#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DOCOD layer validator.

It exists because the same bug showed up three times in this project, always
via a reference declared in prose and never verified:

  1. "CI-CD Agent" vs cicd-guidelines      → 4 unreachable agents
  2. qa-report.md vs qa.md                 → artifacts diverging between repos
  3. @.claude/rules vs .agents/rules       → 4 prompts reading into the void

All three are the same failure. A folder structure without validation would be
the fourth.

The fourth showed up in another guise: `format: mermaid` lived in layer 2
without tripping anything, because the vendor list only had models and
harnesses. A diagram language is a concrete tool all the same — a leak does
not need to name Anthropic to be a leak. Hence the second list below.

This script checks the rule that holds up Douro's portability:
**no vendor name may appear in layers 1-2.**

Usage:  python3 validate-layers.py
"""
import sys, glob, os, re

try:
    import yaml
except ImportError:
    sys.exit("requires pyyaml: pip install pyyaml")

BASE = os.path.dirname(os.path.abspath(__file__))

# Vendors, harnesses, models, and concrete tools.
# Any of these is layer 3 by definition.
VENDOR = re.compile(
    r"\b(claude|anthropic|context7|playwright|cypress|selenium|deepseek|openai|"
    r"gpt-?[0-9]|llama|gemini|cursor|copilot|windsurf|aider|phidata|agno|"
    r"langchain|crewai|duckduckgo|crawl4ai|tavily|ripgrep|axe-core|lighthouse)\b",
    re.I,
)

# Concrete tools that are not LLM vendors — which is why they slipped through.
# `format: mermaid` lived in layer 2 until someone caught it by eye.
# The method demands "diagram as text"; WHICH language belongs to the adapter.
#
# `d2` (the diagram language) left the list: it collided with "### D2 ·", which
# is the numbering of the inquiry sections. Twelve false positives at once.
# Coverage that costs credibility is not worth it — artifacts.yaml itself says
# a false positive trains the user to ignore the alert.
TOOLING = re.compile(
    r"\b(mermaid|plantuml|graphviz|drawio|lucidchart|excalidraw|"
    r"swagger|openapi|asyncapi|protobuf|grpc|graphql|"
    r"postgres(ql)?|mysql|mongo(db)?|dynamodb|redis|kafka|rabbitmq|sqlite|"
    r"docker|kubernetes|k8s|terraform|jenkins|github actions|gitlab ci|"
    r"aws|azure|gcp|prometheus|grafana|datadog|jaeger|opentelemetry)\b",
    re.I,
)

# Language, framework, runtime, package manager, lint/test/type tool.
# None of these may appear in the bundle — not even as an example. The method
# serves any repo, and the first `pytest` a Rust reader finds gives that the lie.
#
# OFF THE LIST for colliding with common words — second case after `d2` vs
# "### D2": `black` matched "Black Friday", `uv` matched anything, `go`/`dart`
# /`swift`/`spring` are words before they are languages. Precision matters more
# than coverage here: a false positive trains the user to ignore the alert, and
# an ignored validator protects nothing.
STACK = re.compile(
    r"\b(python|django|flask|fastapi|celery|pytest|ruff|mypy|pylint|pip|poetry|"
    r"javascript|typescript|node|npm|yarn|pnpm|bun|deno|react|vue|angular|svelte|next\.?js|"
    r"remix|nest\.?js|express|jest|vitest|mocha|eslint|prettier|tsc|webpack|vite|"
    r"rust|cargo|clippy|axum|actix|tokio|"
    r"golang|gofmt|"
    r"java|maven|gradle|junit|kotlin|"
    r"ruby|rails|rspec|bundler|"
    r"php|composer|laravel|symfony|phpunit|"
    r"dotnet|nuget|nunit|xunit|"
    r"xcode|cocoapods|flutter)\b",
    re.I,
)

# Postcondition nature. See `postconditions_schema` in spec/agent.yaml.
# A postcondition is a hook in prose: as long as it is only prose, it is
# advisory — and advisory is what broke this project seven times before.
#
# Without a prefix the default is `judgment`, the weakest, on purpose: whoever
# did not classify does not get the promise of being enforced.
NATUREZAS = {"deterministic", "evidence", "judgment"}

ERRORS, WARNS = [], []


def walk_values(node, path=""):
    """Walks only the VALUES of the YAML. Comments are not loaded by the
    parser, so explaining the rule in a comment does not trip the check —
    that was the false positive of the first version."""
    if isinstance(node, dict):
        for k, v in node.items():
            yield from walk_values(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk_values(v, f"{path}[{i}]")
    elif isinstance(node, str):
        yield path, node


def check_neutral(f, rel):
    """Layers 1-2: zero vendor names in the values."""
    try:
        doc = yaml.safe_load(open(f, encoding="utf-8"))
    except yaml.YAMLError as e:
        ERRORS.append(f"[{rel}] invalid YAML: {e}")
        return
    for path, val in walk_values(doc):
        # `note:` and `issue:` document the problem — citing the leak to
        # explain it is not a leak. Deliberate distinction.
        if re.search(r"\.(note|issue|root_cause|desc|property)$", path):
            continue
        for hit in set(m.lower() for m in VENDOR.findall(val)):
            ERRORS.append(f"[{rel}] LAYER LEAK in `{path.lstrip('.')}`: '{hit}' is layer 3 → move it to docod/adapters/")
        # `sections:` and `delivers:` describe the CONTENT of the artifact —
        # citing an engine there is the document talking about the project, not
        # the method choosing.
        if re.search(r"\.(sections|delivers)(\[\d+\])?$", path):
            continue
        for m in TOOLING.finditer(val):
            hit = m.group(0)
            ERRORS.append(
                f"[{rel}] CONCRETE TOOL in `{path.lstrip('.')}`: '{hit}'. "
                f"The method states the PRINCIPLE; the tool belongs to the adapter or the project."
            )


def check_migration(inst):
    """Layer 4: the pending list must not lie.

    It exists because a badly indented comment moved `gate-ownership` — an OPEN
    blocker — into `resolved:`, and duplicated two others. The report started
    saying "0 warnings". A blocker that vanishes from the report is worse than
    a blocker: a blocker warns, silence reassures.
    """
    # migration moved to migration.yaml (dev-only; not installed, not in the template)
    import os as _os
    _mf = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "migration.yaml")
    _m = yaml.safe_load(open(_mf, encoding="utf-8")) if _os.path.exists(_mf) else {}
    mig = (_m or {}).get("migration") or inst.get("migration") or {}
    pending = mig.get("pending") or []
    resolved = mig.get("resolved") or []

    for lista, nome, campo in ((pending, "pending", "decision"), (resolved, "resolved", "resolution")):
        vistos = set()
        for item in lista:
            i = item.get("id")
            if not i:
                ERRORS.append(f"[docod.yaml] migration.{nome} item without `id`")
                continue
            if i in vistos:
                ERRORS.append(f"[docod.yaml] `{i}` duplicated in migration.{nome}")
            vistos.add(i)
            if not item.get(campo):
                ERRORS.append(f"[docod.yaml] `{i}` in {nome} without `{campo}`")
        if nome == "resolved":
            for i in vistos & {x.get("id") for x in pending}:
                ERRORS.append(
                    f"[docod.yaml] `{i}` is in pending AND in resolved — "
                    f"a pending item cannot be both resolved and open"
                )


def check_agents():
    """Layer 2: the markdown agents against the registry.

    It exists because the failure came back for the SIXTH time, now in the
    skills registry's `used_by`: the registry promised data-privacy for the prd,
    the prd did not declare it, and nobody noticed for three sessions. A
    reference declared in prose, no validator, silent drift — the same failure
    as always, in new clothes.

    `used_by` is informative, not a property. But wrong informative is worse
    than absent: it looks like an answer.
    """
    method_f = os.path.join(BASE, "spec", "method.yaml")
    arts_f = os.path.join(BASE, "spec", "artifacts.yaml")
    if not (os.path.exists(method_f) and os.path.exists(arts_f)):
        return

    reg = (yaml.safe_load(open(method_f, encoding="utf-8")).get("skills") or {}).get("registry") or {}
    artifacts = yaml.safe_load(open(arts_f, encoding="utf-8")).get("artifacts") or {}

    agents, declared, corpos = {}, {}, {}
    for f in sorted(glob.glob(os.path.join(BASE, "agents", "*.md"))):
        rel = os.path.relpath(f, BASE)
        raw = open(f, encoding="utf-8").read()
        if not raw.startswith("---"):
            ERRORS.append(f"[{rel}] no YAML frontmatter")
            continue
        try:
            d = yaml.safe_load(raw.split("---")[1]) or {}
        except yaml.YAMLError as e:
            ERRORS.append(f"[{rel}] invalid frontmatter: {e}")
            continue
        key = d.get("key")
        if not key:
            ERRORS.append(f"[{rel}] no `key`")
            continue
        agents[key] = (rel, d)
        corpos[key] = raw.split("---", 2)[2] if raw.count("---") >= 2 else ""

        # Body roles. The v1 `knowledge` had 77 sources, 4 implicit roles and
        # 30+ free-form names — question_bank vs questions_bank vs
        # questions_userstories were the SAME role under three names. Now the
        # role is a section, and sections are enumerated. Enumerating without
        # validating would repeat the failure with new syntax.
        # A role is the `## x` that OPENS a block after `---`. The `## 1. Vision`
        # headings inside ## structure are the document template, not roles.
        body = raw.split("---", 2)[2] if raw.count("---") >= 2 else ""
        found = {
            m.group(1)
            for bloco in re.split(r"^---$", body, flags=re.M)
            if (m := re.match(r"\s*## ([A-Za-z_]\w*)\s*$", bloco.lstrip("\n").split("\n")[0]))
        }
        if "structure" not in found:
            ERRORS.append(f"[{rel}] no `## structure` — the agent does not know what to deliver")
        for extra in sorted(found - {"structure", "inquiry", "style", "schema"}):
            ERRORS.append(
                f"[{rel}] non-enumerated role: `## {extra}` — "
                f"use structure | inquiry | style | schema"
            )
        # `interactive: true` promises to ask. Without inquiry, it does not know what.
        if d.get("interactive") and "inquiry" not in found:
            ERRORS.append(f"[{rel}] `interactive: true` but no `## inquiry` — promises to ask and does not say what")

        # The BODY is also layer 2, and nobody was looking.
        #
        # The validator only read YAML values — so the "neutral layer" was
        # neutral only where the script looked. The markdown bodies carried
        # `pytest`, `ruff.toml`, `mypy.ini`: examples, but all from the same
        # stack. A Rust reader opens the task-executor and sees Python. The
        # method promises "any language" and contradicts it on page one.
        #
        # An example needs to be concrete to teach; the FORM is the example,
        # not the tool. `<test command> → 214 passed` teaches the same thing
        # and matches nobody.
        # ONLY the stack list. And the distinction is fine-grained:
        #
        #   prescriptive   "run `pytest`"                     → the method chose → leak
        #   illustrative   "we chose Azure over AWS"          → the method SHOWS
        #                                                       what a decision is → legitimate
        #
        # The ADR exists to record exactly that kind of sentence; banning cloud
        # and database from its body would ban it from showing what it does.
        # Whereas `pytest` in an executor illustrates nothing — it commands.
        for hit in sorted(set(m.group(0).lower() for m in STACK.finditer(body))):
            ERRORS.append(
                f"[{rel}] stack in the body: '{hit}' — the example must be the FORM, "
                f"not the tool. Use a placeholder: `<test command>`, `<linter config>`"
            )

        # a declared skill has to actually exist
        for s in d.get("skills") or []:
            declared.setdefault(s, set()).add(key)
            if s not in reg:
                ERRORS.append(f"[{rel}] declares unregistered skill: '{s}'")
            elif not os.path.exists(os.path.join(BASE, "spec", "skills", s, "SKILL.md")):
                ERRORS.append(f"[{rel}] skill '{s}' registered but has no SKILL.md")

        # the artifact it claims to own has to exist and point back.
        # `artifact` may be a key or a list: an agent owns several
        # (task-extraction has tasks + task); an artifact never has two owners.
        # The invariant is the artifact→owner direction.
        owned = ((d.get("contract") or {}).get("owns") or {}).get("artifact")
        if not owned:
            ERRORS.append(f"[{rel}] no `owns` — an agent that delivers no document binds nothing")
        for a in (owned if isinstance(owned, list) else [owned] if owned else []):
            if a not in artifacts:
                ERRORS.append(f"[{rel}] owns nonexistent artifact: '{a}'")
            elif artifacts[a].get("owner") != key:
                ERRORS.append(
                    f"[{rel}] owns '{a}', but artifacts.yaml gives the owner as "
                    f"'{artifacts[a].get('owner')}' — one artifact, one owner"
                )

    # `reads` and `requires` — SEVENTH occurrence of this project's failure.
    #
    # The design-review declared `reads: [observability, ...]` and that artifact
    # never existed: the owner is `observability`, but the ARTIFACT is named
    # `slos`. It went through three sessions because the validator checked
    # ownership and ignored consumption — and consumption is most of the graph.
    #
    # It is the same failure as "CI-CD Agent" vs cicd-guidelines, qa-report.md
    # vs qa.md, @.claude/rules vs .agents/rules: a declared reference, nothing
    # on the other side, nobody checking.
    for k, (rel, d) in agents.items():
        for an, a in ((d.get("contract") or {}).get("actions") or {}).items():
            for r in (a.get("requires") or []):
                if r.get("artifact") not in artifacts:
                    ERRORS.append(f"[{rel}] `{an}.requires` demands nonexistent artifact: '{r.get('artifact')}'")
                elif not r.get("status"):
                    ERRORS.append(f"[{rel}] `{an}.requires` of '{r['artifact']}' without `status` — a precondition without a status blocks nothing")
            for r in (a.get("reads") or []):
                if r not in artifacts:
                    ERRORS.append(
                        f"[{rel}] `{an}.reads` cites nonexistent artifact: '{r}' — "
                        f"check that you did not use the AGENT name in place of the ARTIFACT"
                    )
            # A postcondition without a declared nature is the EIGHTH occurrence
            # of this project's failure — and the biggest by volume: 344 claims
            # nobody checks. A postcondition is a hook in prose; as long as it
            # is only prose, it is advisory, and advisory is what broke
            # everything here seven times before.
            #
            # The nature goes in the PREFIX of the string: "deterministic: ...".
            # Without a prefix, the default is `judgment` — the weakest, on
            # purpose: whoever did not classify does not get the promise of
            # being enforced.
            # The prefix is ANCHORED at the start and matches only the three
            # words. The "has a colon near the start" heuristic produced a false
            # positive on the first try: "If breaking: whoever consumes is..."
            # has a colon and is not a prefix. My third false positive in this
            # validator — after `d2` vs "### D2" and `black` vs "Black Friday".
            # The pattern of the three is the same: matching by loose form
            # instead of exact form. A false positive trains the user to ignore
            # the alert.
            for pc in (a.get("postconditions") or []):
                m = re.match(r"^(\w+):\s", pc)
                if m and m.group(1) not in NATUREZAS:
                    ERRORS.append(
                        f"[{rel}] `{an}` postcondition with invalid nature: '{m.group(1)}' — "
                        f"use {' | '.join(sorted(NATUREZAS))}"
                    )
            w = (a.get("writes") or {}).get("artifact")
            owned = ((d.get("contract") or {}).get("owns") or {}).get("artifact")
            owned = owned if isinstance(owned, list) else [owned]
            for x in (w if isinstance(w, list) else [w] if w else []):
                if x not in artifacts:
                    ERRORS.append(f"[{rel}] `{an}.writes` nonexistent artifact: '{x}'")
                elif x not in owned:
                    ERRORS.append(f"[{rel}] `{an}.writes` to '{x}', which it does not own — one artifact, one owner")

    # RULES. A new field without a validator is scheduled drift — that is how
    # used_by accumulated six divergences in three sessions.
    for n, a in artifacts.items():
        if a.get("kind") != "rule":
            continue
        t = a.get("template")
        if not t:
            ERRORS.append(f"[spec/artifacts.yaml] rule '{n}' without `template:` — with no mold, the factory generates generic, and generic is worse than nothing")
        elif not os.path.exists(os.path.join(BASE, t)):
            ERRORS.append(f"[spec/artifacts.yaml] rule '{n}': mold missing at '{t}'")
        else:
            corpo = open(os.path.join(BASE, t), encoding="utf-8").read()
            for sec in ("## derivation", "## structure"):
                if sec not in corpo:
                    ERRORS.append(f"[{t}] mold without `{sec}` — with no derivation the factory becomes a form and re-asks what the ADR already answered")
        if a.get("owner") != "rules-factory":
            ERRORS.append(f"[spec/artifacts.yaml] rule '{n}' has owner '{a.get('owner')}' — rules are created by the rules-factory")

    # used_by × reality. Only complains about agents that ALREADY EXIST: the 18
    # missing ones are not drift, they are backlog.
    for s, meta in reg.items():
        prometido = set(meta.get("used_by") or [])
        real = declared.get(s, set())
        for a in sorted((prometido & set(agents)) - real):
            ERRORS.append(
                f"[spec/method.yaml] skill '{s}': used_by promises '{a}', "
                f"but {a} does not declare it → either the agent lost the skill, or the registry lies"
            )
        for a in sorted(real - prometido):
            ERRORS.append(
                f"[spec/method.yaml] skill '{s}': '{a}' declares it, but is not in used_by"
            )

    # every artifact has an owner, and the owner exists (or is yet to be written)
    escritos = set(agents)
    for name, a in artifacts.items():
        owner = a.get("owner")
        if not owner:
            ERRORS.append(f"[spec/artifacts.yaml] artifact '{name}' without an owner")
        elif owner.startswith("{"):
            continue                       # dynamic owner — `decisions` is like that
        elif owner in escritos:
            _, d = agents[owner]
            o = ((d.get("contract") or {}).get("owns") or {}).get("artifact")
            if name not in (o if isinstance(o, list) else [o]):
                ERRORS.append(
                    f"[spec/artifacts.yaml] '{name}' points at owner '{owner}', "
                    f"but the agent does not declare owning it"
                )
        # co_writer is a declared exception. An exception without a written limit is a new rule.
        cw = a.get("co_writer")
        if cw:
            if not cw.get("may_not_write"):
                ERRORS.append(
                    f"[spec/artifacts.yaml] '{name}' has co_writer without `may_not_write` — "
                    f"an exception without a written limit becomes a new rule"
                )
            if cw.get("agent") == owner:
                ERRORS.append(f"[spec/artifacts.yaml] '{name}': co_writer is the owner itself")

    # SECTIONS × STRUCTURE — the registry's `sections:` mirrors what the owner
    # agent's ## structure already defines, and a mirror without a validator
    # drifts (this project's recurring failure, found live: EVERY approved ADR
    # in a real repo failed verify's section count at once — the registry said
    # 8, the v1 prompt's list, with Status and Authors that the rewrite moved
    # into the frontmatter; the structure says 6, and the agent rightly refused
    # to invent a seventh section to please a counter). agent.yaml already
    # ruled it: the body IS the prompt and ## structure IS the minimum
    # sections — one place. The registry mirrors it only so the runtime can
    # count without parsing agent bodies; THIS check is what keeps the mirror
    # honest. Skipped when the owner owns more than one artifact: one
    # ## structure cannot be attributed mechanically (tech-lead's structure is
    # counsel's; the diagnostic's sections live only in the registry — a
    # single source, nothing to drift from).
    for name, a in artifacts.items():
        secs, owner = a.get("sections"), a.get("owner")
        if not secs or not owner or owner.startswith("{") or owner not in agents:
            continue
        _, d = agents[owner]
        owned = ((d.get("contract") or {}).get("owns") or {}).get("artifact")
        owned = [x for x in (owned if isinstance(owned, list) else [owned]) if x]
        if len(owned) != 1:
            continue
        m = re.search(r"^## structure\s*\n(.*?)(?=^## (?:inquiry|style|schema)\b|\Z)",
                      corpos.get(owner, ""), re.S | re.M)
        if not m:
            continue
        h2 = re.findall(r"^## +\S", m.group(1), re.M)
        minimo = len(secs) - (1 if str(secs[0]).strip().lower() == "title" else 0)
        if len(h2) < minimo:
            ERRORS.append(
                f"[spec/artifacts.yaml] '{name}': sections declares {minimo} minimum, but the "
                f"owner's ## structure defines {len(h2)} '##' sections — every REAL document "
                f"born from the structure fails verify's count (the ADR case: 15 approved ADRs "
                f"failing at once). The structure is the source; fix the registry mirror"
            )

    print(f"\nLAYER 2 · AGENTS — {len(agents)} written, {len(reg)} skills, {len(artifacts)} artifacts")
    print("-" * 78)
    print(f"  {'✗' if ERRORS else '✓'} declared skills resolve · used_by matches · every artifact has an owner and the owner confirms · sections mirror the owner's structure")


def check_conductor():
    """The conductor contract — the one NON-AGENT contract in the bundle.

    CONDUCTOR.md is referenced by commands.yaml (the reconciliation note),
    agent.yaml (nao_e_agente.conductor) and the discovery block install.sh
    writes into CLAUDE.md/AGENTS.md. A declared reference with nothing on the
    other side is this project's recurring failure — so the reference is
    validated. It is NOT in agents/ on purpose: it owns no document, and the
    agent law ("an agent that delivers no document binds nothing") stays
    untouched instead of gaining a carve-out. What is checked here is the
    little that CAN be: the file exists, its limbs are present, and its body
    honors layer-2 neutrality like every agent body does.
    """
    f = os.path.join(BASE, "CONDUCTOR.md")
    if not os.path.exists(f):
        ERRORS.append(
            "[CONDUCTOR.md] missing — commands.yaml, agent.yaml and the discovery "
            "block reference the conductor contract; a declared reference with "
            "nothing on the other side is this project's recurring failure"
        )
        return
    corpo = open(f, encoding="utf-8").read()
    for sec in ("## what you do", "## never", "## style", "## the hand-back, checked"):
        if sec not in corpo:
            ERRORS.append(
                f"[CONDUCTOR.md] missing `{sec}` — the conductor contract lost a limb; "
                f"an incomplete contract governs less than it claims to"
            )
    for hit in sorted(set(m.group(0).lower() for m in STACK.finditer(corpo))):
        ERRORS.append(
            f"[CONDUCTOR.md] stack in the body: '{hit}' — the contract is layer 2; "
            f"the example must be the FORM, not the tool"
        )
    print(f"\nLAYER 2 · CONDUCTOR — the non-agent contract")
    print("-" * 78)
    print(f"  {'✗' if any('CONDUCTOR' in e for e in ERRORS) else '✓'} CONDUCTOR.md exists · limbs present · body neutral")


def main():
    spec = sorted(glob.glob(os.path.join(BASE, "spec", "**", "*.yaml"), recursive=True))
    adapters = sorted(glob.glob(os.path.join(BASE, "adapters", "*.yaml")))
    instance = os.path.join(BASE, "docod.yaml")

    if not spec:
        ERRORS.append("no files in spec/ — layers 1-2 missing")
    if not adapters:
        ERRORS.append("no adapter in adapters/ — layer 3 missing")

    print("LAYERS 1-2 · NEUTRAL — no vendor allowed")
    print("-" * 78)
    for f in spec:
        rel = os.path.relpath(f, BASE)
        before = len(ERRORS)
        check_neutral(f, rel)
        print(f"  {'✗' if len(ERRORS) > before else '✓'} {rel}")

    # method + capabilities
    method_f = os.path.join(BASE, "spec", "method.yaml")
    caps = {}
    if os.path.exists(method_f):
        m = yaml.safe_load(open(method_f, encoding="utf-8"))
        caps = m.get("capabilities", {}) or {}
        stages = m.get("stages", {}) or {}
        if not any(s.get("feeds_back_to") for s in stages.values()):
            ERRORS.append("[spec/method.yaml] no stage feeds back into another — without a loop, DOCOD becomes waterfall")

    check_agents()
    check_conductor()

    print("\nLAYER 3 · ADAPTERS — capability coverage")
    print("-" * 78)
    for f in adapters:
        rel = os.path.relpath(f, BASE)
        try:
            ad = yaml.safe_load(open(f, encoding="utf-8"))
        except yaml.YAMLError as e:
            ERRORS.append(f"[{rel}] invalid YAML: {e}")
            continue
        bound = ad.get("capabilities", {}) or {}
        missing = [c for c in caps if c not in bound]
        unknown = [c for c in bound if c not in caps]
        degraded = [c for c, v in bound.items() if isinstance(v, dict) and v.get("degraded")]
        key = (ad.get("adapter") or {}).get("key", "?")
        status = "✓" if not missing and not unknown else "✗"
        print(f"  {status} {key:14} {len(bound)}/{len(caps)} bound"
              + (f" · degraded: {', '.join(degraded)}" if degraded else ""))
        for c in missing:
            WARNS.append(f"[{rel}] capability '{c}' not bound — actions that require it become unavailable in this harness")
        for c in unknown:
            ERRORS.append(f"[{rel}] capability '{c}' does not exist in spec/method.yaml")

    print("\nLAYER 4 · INSTANCE")
    print("-" * 78)
    if os.path.exists(instance):
        inst = yaml.safe_load(open(instance, encoding="utf-8"))
        check_migration(inst)
        adapter_keys = {(yaml.safe_load(open(a, encoding="utf-8")).get("adapter") or {}).get("key") for a in adapters}
        chosen = inst.get("adapter")
        if chosen not in adapter_keys:
            ERRORS.append(f"[docod.yaml] adapter '{chosen}' does not exist in adapters/ {sorted(adapter_keys)}")
        topo = inst.get("topology")
        if topo not in {"monorepo", "single", "multi-repo"}:
            ERRORS.append(f"[docod.yaml] invalid topology '{topo}'")
        targets = inst.get("targets") or {}
        if not targets:
            ERRORS.append("[docod.yaml] no target declared")
        if topo == "single" and len(targets) > 1:
            ERRORS.append(f"[docod.yaml] topology 'single' with {len(targets)} targets")
        print(f"  ✓ adapter: {chosen} · topology: {topo} · targets: {', '.join(targets)}")
        blockers = [p for p in (inst.get("migration") or {}).get("pending", []) if p.get("severity") == "blocker"]
        for b in blockers:
            WARNS.append(f"[migration/blocker] {b['id']}: {b['issue'][:90]}")
    else:
        ERRORS.append("docod.yaml missing")

    print()
    if WARNS:
        print(f"WARN ({len(WARNS)})"); print("-" * 78)
        for w in WARNS: print(f"  ⚠ {w}")
        print()
    if ERRORS:
        print(f"ERROR ({len(ERRORS)})"); print("-" * 78)
        for e in ERRORS: print(f"  ✗ {e}")
        print(f"\n❌ FAILED — {len(ERRORS)} error(s), {len(WARNS)} warning(s)")
        return 1
    print(f"✅ OK — layers 1-2 neutral, adapters cover the capabilities, the instance resolves. {len(WARNS)} warning(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
