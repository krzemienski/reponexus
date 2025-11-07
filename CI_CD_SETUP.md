# CI/CD Setup for Repo Nexus

## Overview

This document describes the EAS Build configuration and GitHub Actions CI/CD setup for the Repo Nexus Expo application.

## Table of Contents

1. [EAS Build Configuration](#eas-build-configuration)
2. [GitHub Actions Workflow](#github-actions-workflow)
3. [Required Secrets and Environment Variables](#required-secrets-and-environment-variables)
4. [Build Profiles](#build-profiles)
5. [Local Testing](#local-testing)
6. [Triggering Builds](#triggering-builds)
7. [Troubleshooting](#troubleshooting)

---

## EAS Build Configuration

### File: `eas.json`

The EAS Build configuration is defined in `/home/user/reponexus/eas.json` with three build profiles:

#### 1. Development Profile
- **Purpose**: For local development and testing on iOS Simulator
- **Bundle ID**: `com.reponexus.ios.dev`
- **Distribution**: Internal
- **Simulator Build**: Yes
- **Development Client**: Enabled
- **Caching**: Enabled

```json
{
  "developmentClient": true,
  "distribution": "internal",
  "ios": {
    "simulator": true,
    "bundleIdentifier": "com.reponexus.ios.dev"
  },
  "cache": {
    "disabled": false
  }
}
```

#### 2. Preview Profile
- **Purpose**: For internal testing and QA on physical devices
- **Bundle ID**: `com.reponexus.ios.preview`
- **Distribution**: Internal (Ad Hoc)
- **Simulator Build**: No
- **Caching**: Enabled

```json
{
  "distribution": "internal",
  "ios": {
    "simulator": false,
    "bundleIdentifier": "com.reponexus.ios.preview"
  },
  "cache": {
    "disabled": false
  }
}
```

#### 3. Production Profile
- **Purpose**: For App Store submission
- **Bundle ID**: `com.reponexus.ios`
- **Distribution**: Store
- **Build Configuration**: Release
- **Caching**: Enabled

```json
{
  "distribution": "store",
  "ios": {
    "bundleIdentifier": "com.reponexus.ios",
    "buildConfiguration": "Release"
  },
  "cache": {
    "disabled": false
  }
}
```

### EAS CLI Requirements

The configuration requires EAS CLI version 12.0.0 or higher:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "requireCommit": false
  }
}
```

---

## GitHub Actions Workflow

### File: `.github/workflows/build.yml`

The CI/CD workflow is triggered on:

1. **Push to branches**: `main`, `develop`, `claude/*`
2. **Pull requests** to: `main`, `develop`
3. **Manual dispatch**: Via GitHub Actions UI

### Workflow Jobs

#### Job 1: Validate Configuration (Always runs)

```yaml
validate:
  - Checkout code
  - Setup Node.js 20 with npm cache
  - Install dependencies (npm ci)
  - Validate eas.json syntax
  - Validate app.json syntax
  - Run type checking
  - Run linter
```

#### Job 2: EAS Build (On push or manual dispatch)

```yaml
build:
  - Checkout code
  - Setup Node.js 20 with npm cache
  - Setup Expo and EAS CLI
  - Install dependencies
  - Determine build profile (development by default)
  - Execute EAS build (--no-wait for async build)
  - Generate build summary
```

#### Job 3: Verify PR (On pull requests only)

```yaml
verify-pr:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Display verification message
  - Provide instructions for triggering builds
```

### Manual Workflow Dispatch

The workflow supports manual triggering with custom inputs:

- **Profile**: `development`, `preview`, or `production`
- **Platform**: `ios` or `all`

---

## Required Secrets and Environment Variables

### GitHub Repository Secrets

You must configure the following secret in your GitHub repository:

#### 1. `EXPO_TOKEN`

**Purpose**: Authentication token for EAS CLI to interact with Expo services

**How to obtain**:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Create a personal access token
eas token:create --name "GitHub Actions CI/CD"
```

**How to add to GitHub**:

1. Go to your repository on GitHub
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EXPO_TOKEN`
5. Value: Paste the token from the command above
6. Click "Add secret"

### EAS Project ID

The project ID is configured in `/home/user/reponexus/app.json`:

```json
{
  "extra": {
    "eas": {
      "projectId": "repo-nexus-project"
    }
  }
}
```

**Note**: You'll need to update this with your actual Expo project ID after running `eas build:configure`.

---

## Build Profiles

### Development Builds

**Use case**: Local development, debugging, testing new features

**Command**:
```bash
eas build --platform ios --profile development
```

**Output**: iOS Simulator build (.app file)

**Installation**:
```bash
# After download, drag the .app file to your simulator
```

### Preview Builds

**Use case**: Internal testing, QA, stakeholder demos

**Command**:
```bash
eas build --platform ios --profile preview
```

**Output**: Ad Hoc build (.ipa file)

**Requirements**:
- Apple Developer account
- Registered devices in Apple Developer Portal
- Valid provisioning profile

**Installation**:
- Via TestFlight (internal testing)
- Direct installation via Apple Configurator

### Production Builds

**Use case**: App Store submission

**Command**:
```bash
eas build --platform ios --profile production
```

**Output**: App Store build (.ipa file)

**Requirements**:
- Apple Developer account ($99/year)
- App Store Connect app record
- Valid distribution certificate
- App Store provisioning profile

---

## Local Testing

### Prerequisites

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   # Initialize EAS project (if not already done)
   eas build:configure
   ```

### Test Build Configuration

Validate your configuration without building:

```bash
# Check eas.json syntax
node -e "console.log(JSON.stringify(require('./eas.json'), null, 2))"

# Check app.json syntax
node -e "console.log(JSON.stringify(require('./app.json'), null, 2))"

# Run type checking
npm run type-check

# Run linter
npm run lint
```

### Local Development Build

Build locally on your machine (faster for testing):

```bash
# iOS Simulator build (requires macOS with Xcode)
eas build --platform ios --profile development --local

# This will:
# 1. Install dependencies
# 2. Prebuild native code
# 3. Compile the iOS app
# 4. Output a .app file in the project directory
```

**Note**: Local builds require:
- macOS with Xcode installed (for iOS)
- Sufficient disk space (~10GB free)
- 30-60 minutes for first build

### Cloud Build (Recommended)

Cloud builds run on Expo's servers:

```bash
# Start a cloud build
eas build --platform ios --profile development

# The build runs on Expo's infrastructure
# You'll get a link to track progress
# Download the build when complete
```

---

## Triggering Builds

### Automatic Triggers

Builds are automatically triggered when you push to:
- `main` branch
- `develop` branch
- Any `claude/*` branch (e.g., `claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib`)

**Current branch**: `claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib`

Push to this branch will automatically trigger a development build:

```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
```

### Manual Triggers

#### Via GitHub UI:

1. Go to the "Actions" tab in your repository
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Select:
   - **Branch**: Choose the branch to build from
   - **Build profile**: development/preview/production
   - **Platform**: ios/all
5. Click "Run workflow"

#### Via GitHub CLI:

```bash
# Install GitHub CLI
brew install gh

# Trigger a development build
gh workflow run "EAS Build" \
  --ref main \
  -f profile=development \
  -f platform=ios

# Trigger a preview build
gh workflow run "EAS Build" \
  --ref main \
  -f profile=preview \
  -f platform=ios
```

### Pull Request Workflow

When you create a pull request:
1. The workflow validates configuration
2. Runs type checking and linting
3. Does NOT trigger actual builds (to save resources)
4. Displays instructions for triggering builds after merge

---

## Troubleshooting

### Common Issues

#### 1. Build fails with "EXPO_TOKEN not found"

**Solution**:
- Verify the `EXPO_TOKEN` secret is set in GitHub repository settings
- Regenerate the token if expired:
  ```bash
  eas token:create --name "GitHub Actions CI/CD"
  ```

#### 2. Build fails with "Invalid bundle identifier"

**Solution**:
- Check that bundle identifiers in `eas.json` match those in Apple Developer Portal
- Ensure you have the necessary provisioning profiles
- For preview/production builds, you need an Apple Developer account

#### 3. Build fails during "Install dependencies"

**Solution**:
- Verify `package.json` dependencies are valid
- Check for version conflicts
- Try running locally:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

#### 4. Type checking or linting fails

**Solution**:
- Run locally to see errors:
  ```bash
  npm run type-check
  npm run lint
  ```
- Fix errors before pushing
- Or temporarily disable checks (not recommended)

#### 5. Build succeeds but app crashes

**Solution**:
- Check build logs in Expo dashboard
- Verify native dependencies are properly configured
- Ensure plugins in `app.json` are compatible
- Test development build first before preview/production

#### 6. "Project not found" error

**Solution**:
- Update `projectId` in `app.json` with your actual Expo project ID
- Run `eas build:configure` to set up the project
- Link your local project to Expo:
  ```bash
  eas project:init
  ```

### Checking Build Status

#### Via Expo Dashboard:

1. Visit https://expo.dev
2. Login with your Expo account
3. Navigate to your project
4. Click "Builds" to see all build history

#### Via EAS CLI:

```bash
# List all builds
eas build:list --platform ios

# Check specific build status
eas build:view <build-id>

# Download a build
eas build:download <build-id>
```

#### Via GitHub Actions:

1. Go to the "Actions" tab in your repository
2. Click on the workflow run
3. View logs and build summary
4. Each step shows detailed output

### Getting Help

- **Expo Documentation**: https://docs.expo.dev/build/introduction/
- **EAS Build Guide**: https://docs.expo.dev/build/setup/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Expo Forums**: https://forums.expo.dev/
- **Expo Discord**: https://chat.expo.dev/

---

## Next Steps

1. **Set up EXPO_TOKEN secret** in GitHub repository settings
2. **Run `eas build:configure`** if you haven't already
3. **Update `projectId`** in app.json with your actual Expo project ID
4. **Update submit configuration** in eas.json with your Apple ID details:
   - `appleId`: Your Apple ID email
   - `ascAppId`: Your App Store Connect app ID
   - `appleTeamId`: Your Apple Developer Team ID
5. **Test locally** with `eas build --platform ios --profile development`
6. **Push to current branch** to trigger the CI/CD workflow
7. **Monitor the build** in GitHub Actions and Expo dashboard

---

## Configuration Files Summary

### `/home/user/reponexus/eas.json`
- Build profiles: development, preview, production
- iOS-specific configurations
- Bundle identifiers
- Caching settings
- Submit configuration

### `/home/user/reponexus/app.json`
- Expo app configuration
- iOS settings (bundle ID, build number)
- Plugins and experiments
- App metadata

### `/home/user/reponexus/.github/workflows/build.yml`
- GitHub Actions CI/CD workflow
- Multi-job setup (validate, build, verify-pr)
- Manual dispatch support
- Build summaries

---

**Last Updated**: 2025-11-07
**Branch**: claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
**EAS CLI Version**: >= 12.0.0
**Node Version**: 20
