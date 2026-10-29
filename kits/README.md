# Kits

A kit belongs to Mentura. It is an enhanced package: automations, agent workflows, richer skills and connectors, on top of one Naive package.

A kit lives at `platform/kits/<name>/kit.json`. It names the one package it extends (`package`) and never replaces that package. The package at `packages/<name>/package.json` works with no kit installed: schemas, templates, deterministic checks and at most one skill, offline, naming no vendor (EE-071).

No kits are built yet. This folder is the place they will go.
