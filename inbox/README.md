# Inbox

Temporary, format-agnostic intake for anything not yet classified: prose, research,
images, audio, video, datasets, archives, code, patches, or links. This directory is not
a source of truth or a runtime dependency.

Treat every item as untrusted input until reviewed. Do not execute incoming code, install
its dependencies, unpack an unfamiliar archive into the repository, or publish media
before checking its origin and rights.

For each item:

1. Inspect its contents, provenance, license, and relevance.
2. Decide whether to adopt, adapt, cite, defer, or reject it.
3. Route useful material to its owner:
   - narrative order to `notes/outline.md`;
   - reusable language to `notes/copy.md`;
   - open ideas and counterarguments to `notes/ideas.md`;
   - factual claims, citations, and reference-media provenance to `notes/research/`;
   - approved code to the relevant module, with tests;
   - approved production media to the feature or asset location that owns its use;
   - durable architecture decisions to `docs/adr/` only when warranted.
4. Record why rejected or deferred material matters when losing that context would cause
   the same question to be reopened.
5. Remove the processed item from `inbox/`.

This README is the only file intended to remain here.
