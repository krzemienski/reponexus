# EAS Build and CI/CD Guide for Repo Nexus

This document provides comprehensive instructions for building the Expo app using EAS (Expo Application Services) and setting up CI/CD with GitHub Actions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [EAS Setup](#eas-setup)
3. [Local Development Builds](#local-development-builds)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Build Profiles](#build-profiles)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Prerequisites

### Required Tools

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **EAS CLI**: Install globally with `npm install -g eas-cli`
- **Expo CLI**: Included in dependencies (npm ci)

### Accounts Required

- **Expo Account**: Sign up at https://expo.dev
- **Apple Developer Account**: For iOS builds (required for App Store submission)
- **GitHub Account**: For CI/CD pipeline

### Environment Variables

You'll need the following GitHub secrets configured:

- `EXPO_TOKEN`: Your Expo personal access token
  - Generate at: https://expo.dev/settings/tokens
  - Required for CI/CD builds

For production submission, also configure:

- `APPLE_ID`: Your Apple ID
- `APPLE_ID_PASSWORD`: App-specific password from Apple ID settings
- `APPLE_TEAM_ID`: Your Apple Developer Team ID
- `ASC_APP_ID`: Your App Store Connect App ID

## EAS Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

You'll be prompted to authenticate with your Expo account. Your credentials are stored locally in `~/.expo/`.

### 3. Configure Project

```bash
eas build:configure
```

This initializes EAS for your project. The command:
- Updates `app.json` with required fields
- Creates/updates `eas.json` configuration
- Ensures all necessary credentials are set up

**Note**: The project is already configured in this repository. The `eas.json` file contains all build profiles.

### 4. Verify Configuration

```bash
eas config --account-owner $(eas whoami)
```

This displays your current EAS configuration for the project.

## Local Development Builds

### Development Build (iOS Simulator)

For quick iteration during development:

```bash
eas build --platform ios --profile development --local
```

This command:
- Builds using the `development` profile
- Creates a simulator-compatible build
- Includes development client for hot reload
- Runs locally (faster, no cloud build)

**Expected output**: Binary compatible with iOS simulator

### Preview Build (iOS Device)

For testing on a physical device:

```bash
eas build --platform ios --profile preview
```

This command:
- Uses the `preview` profile
- Creates a device-compatible build
- Uploads to EAS servers
- Generates a download QR code for device installation

**Installation on device**:
1. Scan the QR code with your iPhone camera
2. Open the link in Safari
3. Tap "Install" when prompted

### Production Build (App Store)

For App Store submission:

```bash
eas build --platform ios --profile production
```

This command:
- Uses the `production` profile
- Creates an optimized release build
- Signs with production certificate
- Generates IPA ready for App Store submission

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/build.yml` and automatically runs on:

- **Push** to branches: `main`, `develop`, `claude/*`
- **Pull Requests** to: `main`, `develop`

### Build Workflow Steps

1. **Checkout code**: Retrieves your repository
2. **Setup Node.js**: Installs Node.js 20 with npm cache
3. **Setup Expo**: Configures Expo and EAS CLI
4. **Install dependencies**: Runs `npm ci` for clean install
5. **Type check**: Runs `npm run type-check` (TypeScript validation)
6. **Lint**: Runs `npm run lint` (code quality check)
7. **Build iOS**: Triggers EAS build for development profile

### Triggering Builds

**Automatic on Push**:
```bash
git push origin main
# Automatically triggers build
```

**Manual Trigger** (via GitHub UI):
1. Go to repository Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Select branch and click "Run"

**Manual via EAS CLI**:
```bash
eas build --platform ios --profile development
```

### Build Status

Check your build status:

```bash
eas build:list
```

View specific build details:

```bash
eas build:view <BUILD_ID>
```

View build logs:

```bash
eas build:logs <BUILD_ID>
```

## Build Profiles

### Development Profile

**Purpose**: Local development with fast iteration

**Configuration** (`eas.json`):
```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "ios": {
      "simulator": true
    }
  }
}
```

**Features**:
- Development client for hot reload
- Simulator-only build
- Fast turnaround time
- For testing on local machine

**Build locally**:
```bash
eas build --platform ios --profile development --local
```

### Preview Profile

**Purpose**: Testing on physical iOS devices

**Configuration** (`eas.json`):
```json
{
  "preview": {
    "distribution": "internal",
    "ios": {
      "simulator": false,
      "bundleIdentifier": "com.reponexus.ios.preview"
    }
  }
}
```

**Features**:
- Internal distribution (for testing)
- Compatible with physical iOS devices
- Separate bundle ID to avoid conflicts
- QR code for easy installation

**Build for testing**:
```bash
eas build --platform ios --profile preview
```

### Production Profile

**Purpose**: App Store submission

**Configuration** (`eas.json`):
```json
{
  "production": {
    "distribution": "store",
    "ios": {
      "bundleIdentifier": "com.reponexus.ios",
      "buildConfiguration": "Release"
    }
  }
}
```

**Features**:
- Optimized release build
- Code signing for App Store
- App Store distribution
- Production bundle ID

**Build for submission**:
```bash
eas build --platform ios --profile production
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "EXPO_TOKEN not set in secrets"

**Error**: Build fails because `EXPO_TOKEN` is not configured

**Solution**:
1. Generate token: https://expo.dev/settings/tokens
2. Add to GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: Your token
   - Click "Add secret"

#### 2. "Build failed: eas-cli version mismatch"

**Error**: EAS CLI version in CI differs from `eas.json`

**Solution**:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  }
}
```

Update `eas.json` to match or use a flexible version constraint.

#### 3. "iOS build failed: Certificate/Profile issues"

**Error**: Code signing failure

**Solution**:
```bash
# Revoke existing credentials
eas credentials -p ios

# Reconfigure credentials
eas build:configure

# Try building again
eas build --platform ios --profile development
```

#### 4. "npm ci fails: dependency conflicts"

**Error**: Dependency resolution issues

**Solution**:
```bash
# Clear cache locally
npm cache clean --force
npm ci

# Verify dependencies
npm ls
```

#### 5. "Type check fails in CI but works locally"

**Error**: TypeScript compilation differs between environments

**Solution**:
1. Ensure Node.js version matches (20.x)
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Run type check locally to match CI:
   ```bash
   npm run type-check
   ```

#### 6. "Build timeout in GitHub Actions"

**Error**: Build exceeds 45-minute timeout

**Solution**:
- Check network speed and build dependencies
- Use `--cache` optimization in EAS
- Consider simplifying the build profile
- Increase timeout in `.github/workflows/build.yml` if needed:
  ```yaml
  timeout-minutes: 60  # Increase from 45
  ```

### Debugging Tips

1. **View full build logs**:
   ```bash
   eas build:logs <BUILD_ID>
   ```

2. **Simulate CI environment locally**:
   ```bash
   # Use same Node version as CI
   nvm use 20

   # Clean install
   npm ci

   # Run same checks as CI
   npm run type-check
   npm run lint
   ```

3. **Check available EAS resources**:
   ```bash
   eas config
   ```

4. **View build queue status**:
   ```bash
   eas build:list --limit 20
   ```

## Best Practices

### Git Workflow

1. **Use feature branches**:
   ```bash
   git checkout -b claude/feature-name
   git push origin claude/feature-name
   ```
   - Automatic CI build triggered
   - Allows testing before merge

2. **Create pull requests**:
   - Triggers type check and lint
   - Does not trigger full EAS build (saves resources)
   - Merge to main/develop triggers full build

3. **Main branch protection**:
   - Require CI checks to pass
   - Require code review
   - Automatic build on merge

### Build Management

1. **Monitor build queue**:
   ```bash
   eas build:list
   ```
   - Limit concurrent builds if needed
   - Stagger large batches of builds

2. **Clean up old builds**:
   - Consider deleting old builds via EAS dashboard
   - Helps manage storage and resources

3. **Use caching**:
   - Build cache is enabled by default
   - Speeds up subsequent builds
   - Can be cleared if needed:
     ```bash
     eas build:view <BUILD_ID> --cache
     ```

### Version Management

1. **Update version before release**:
   ```json
   {
     "version": "1.1.0",
     "expo": {
       "version": "1.1.0",
       "ios": {
         "buildNumber": "2"
       }
     }
   }
   ```

2. **Build number strategy**:
   - Increment for each build
   - Reset when changing minor/major version
   - iOS requires monotonically increasing build numbers

### Security

1. **Never commit secrets**:
   - Use GitHub secrets for sensitive data
   - `.env` files in `.gitignore`
   - Review `eas.json` before committing

2. **Rotate tokens regularly**:
   - Regenerate `EXPO_TOKEN` periodically
   - Update in GitHub secrets

3. **Secure credentials**:
   ```bash
   # View stored credentials
   eas credentials -p ios

   # Update credentials
   eas credentials -p ios --reset
   ```

### Performance Optimization

1. **Use specific branches for CI**:
   - Avoid building every branch
   - Focus on main, develop, and feature branches

2. **Optimize dependencies**:
   - Regular updates to dependencies
   - Remove unused packages
   - Monitor bundle size

3. **Parallel workflows**:
   - Type check and lint run in parallel
   - EAS build separate from tests
   - Faster overall pipeline

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS CLI Reference](https://docs.expo.dev/build-reference/eas-cli/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Documentation](https://developer.apple.com/)

## Getting Help

1. **Check build logs**:
   ```bash
   eas build:logs <BUILD_ID>
   ```

2. **Review CI logs**:
   - GitHub Actions tab → EAS Build workflow → Latest run

3. **Expo Community**:
   - https://forums.expo.dev/
   - https://discord.gg/expo

4. **GitHub Issues**:
   - Create issue in your repository
   - Include build ID and error logs
