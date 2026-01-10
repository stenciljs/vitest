# Contributing to @stencil/vitest

Thank you for your interest in contributing! This guide will help you get set up for development.

## Development Setup

### 1. Enable Corepack

Corepack manages package manager versions. Enable it if you haven't already:

```bash
corepack enable
```

This allows the project to use the exact pnpm version specified in `package.json`.

### 2. Clone the Repository

```bash
git clone https://github.com/stenciljs/test-utils.git
cd test-utils
```

### 3. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the main package and workspaces.

### 4. Build and test

```bash
pnpm build
pnpm test:unit
pnpm test:e2e
```

### 5. Run code quality checks

```bash
# Run all quality checks
pnpm quality
```

### 6. Commit your changes

```bash
git add .
git commit -m "feat: add new feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test updates

## Release Process

This project uses automated release workflows with semantic versioning.

### Production Releases

Production releases are automated using [semantic-release](https://semantic-release.gitbook.io/semantic-release/) and follow [Conventional Commits](https://www.conventionalcommits.org/) for version bumping.

**To trigger a production release:**

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Select `main` branch
4. Select release type: **production**
5. Optionally enable **Dry run** to preview changes without publishing
6. Click **Run workflow**

**What happens:**

- Analyzes commits since last release
- Determines version bump (major/minor/patch) based on commit types
- Updates `CHANGELOG.md` with release notes
- Creates a git tag (e.g., `v1.2.3`)
- Publishes to npm with `latest` tag
- Creates a GitHub release

### Dev/Nightly Releases

For testing unreleased features, you can publish development versions with custom npm tags.

**To trigger a dev release:**

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Select the branch to publish from using the **"Use workflow from"** dropdown
4. Select release type: **dev**
5. Configure inputs:
   - **NPM tag** - Distribution tag (dev, next, alpha, beta, nightly, canary) - also used as version suffix
   - **Custom NPM tag** - Optional custom tag like `v4.1.x` (overrides selection above)
6. Click **Run workflow**

**What happens:**

- Builds from the selected branch
- Generates a version like `0.0.1-dev.20260109123456.abc1234`
- Publishes to npm with the specified tag
- Creates a git tag for reference

**Example installations:**

```bash
# Install latest dev version
npm install @stencil/vitest@dev

# Install latest nightly version
npm install @stencil/vitest@nightly

# Install specific version tag
npm install @stencil/vitest@v4.1.x
```

### Version Formats

- **Production:** `1.2.3` (semantic versioning)
- **Dev:** `1.2.3-dev.20260109123456.abc1234`
- **Nightly:** `1.2.3-nightly.20260109123456`
- **Alpha/Beta:** `1.2.3-alpha.20260109123456.abc1234`

### Trusted Publishing

This project uses npm's [provenance](https://docs.npmjs.com/generating-provenance-statements) feature for supply chain security. All releases must originate from the `.github/workflows/release.yml` trusted workflow.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
