# OpenShift dynamic plugin SDK - Agent context

## Project overview

See [plugins-overview.md](./docs/plugins-overview.md) and [README.md](./README.md)
for an overview of the dynamic plugin architecture.

## Guidelines

This repository is used by multiple large-scale enterprise web applications. Please
proceed with caution when making any changes to this codebase.

When making changes that may impact existing functionality, ensure that all changelogs
are up-to-date, and that version bumps are done according to semantic versioning.

When adding new functionality, write Jest unit tests, and Cypress end-to-end
and component tests.

## Setup commands

See [developer-setup.md](./docs/developer-setup.md) for instructions on setting
up the development environment.

## Publishing packages

As an AI agent, do NOT publish packages on npm. All package publishing must be
done by a human developer.
