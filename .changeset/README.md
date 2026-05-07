# Changesets

This directory contains changesets for version management.

## Creating a Changeset

When you make a change that warrants a version bump:

```bash
pnpm changeset
```

Follow the prompts to:
1. Select affected packages
2. Choose version bump type (major, minor, patch)
3. Write a description of the change

## Version Packages

To version all packages with changesets:

```bash
pnpm version-packages
```

This updates package.json versions and CHANGELOG.md files.

## Publishing

To publish packages to npm:

```bash
pnpm release
```

This builds and publishes all changed packages.
