# EAS Build Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] npm 10+ installed
- [ ] Expo account created (https://expo.dev)
- [ ] EAS CLI installed globally (`npm install -g eas-cli`)
- [ ] Apple Developer account (for preview/production builds)
- [ ] GitHub repository with Actions enabled

## Initial Setup (One-time)

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### 3. Configure EAS Project

```bash
cd /home/user/reponexus
eas build:configure
```

This will:
- Create or update `eas.json` (already configured)
- Link your local project to Expo
- Generate a project ID

### 4. Update Project ID

After running `eas build:configure`, update the project ID in `app.json`:

```json
{
  "extra": {
    "eas": {
      "projectId": "your-actual-project-id-here"
    }
  }
}
```

### 5. Create GitHub Secret

```bash
# Create an Expo access token
eas token:create --name "GitHub Actions"

# Copy the token output
# Add it to GitHub: Settings → Secrets → New repository secret
# Name: EXPO_TOKEN
# Value: <paste token>
```

## Quick Commands

### Build for iOS Simulator (Development)

```bash
eas build --platform ios --profile development
```

**Result**: .app file you can drag to iOS Simulator

### Build for Physical Devices (Preview)

```bash
eas build --platform ios --profile preview
```

**Result**: .ipa file for TestFlight or Ad Hoc distribution

### Build for App Store (Production)

```bash
eas build --platform ios --profile production
```

**Result**: .ipa file ready for App Store submission

### Local Build (Faster, requires macOS + Xcode)

```bash
eas build --platform ios --profile development --local
```

### Check Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view <build-id>

# Download build
eas build:download <build-id>
```

## CI/CD Workflow

### Automatic Builds

Builds trigger automatically when you push to:
- `main`
- `develop`
- `claude/*` (any branch starting with claude/)

**Current branch**: `claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib`

```bash
# Your changes will trigger a build automatically
git add .
git commit -m "Your changes"
git push origin claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
```

### Manual Builds via GitHub UI

1. Go to **Actions** tab
2. Click **EAS Build** workflow
3. Click **Run workflow**
4. Select:
   - Branch: `claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib`
   - Profile: `development` / `preview` / `production`
   - Platform: `ios` / `all`
5. Click **Run workflow**

## Build Profiles

| Profile | Purpose | Simulator | Requires Apple Dev Account |
|---------|---------|-----------|----------------------------|
| **development** | Local dev & debugging | Yes | No |
| **preview** | Internal testing | No | Yes |
| **production** | App Store submission | No | Yes |

## Bundle Identifiers

- **Development**: `com.reponexus.ios.dev`
- **Preview**: `com.reponexus.ios.preview`
- **Production**: `com.reponexus.ios`

## First Build Test

### Option 1: Cloud Build (Recommended)

```bash
# 1. Ensure you're logged in
eas login

# 2. Start a development build
eas build --platform ios --profile development

# 3. Wait for build (10-20 minutes)
# 4. Download when complete
# 5. Test on iOS Simulator
```

### Option 2: Local Build (macOS only)

```bash
# 1. Install dependencies
npm install

# 2. Start local build
eas build --platform ios --profile development --local

# 3. Wait for build (30-60 minutes first time)
# 4. Output: .app file in project directory
# 5. Drag to iOS Simulator
```

## Troubleshooting

### "EXPO_TOKEN not found"
→ Add the secret in GitHub repository settings

### "Project not found"
→ Run `eas build:configure` to link project

### "Invalid bundle identifier"
→ Check Apple Developer Portal for registered bundle IDs

### "Build failed with code signing error"
→ For preview/production, ensure you have valid certificates and provisioning profiles

### Type checking fails in CI
→ Ensure `npm install` runs successfully
→ Fix TypeScript errors locally first

## Useful Links

- **Expo Dashboard**: https://expo.dev
- **Build Status**: https://expo.dev/accounts/[your-account]/projects/repo-nexus/builds
- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **GitHub Actions**: https://github.com/[your-repo]/actions

## Support

- Expo Forums: https://forums.expo.dev/
- Expo Discord: https://chat.expo.dev/
- Documentation: See `CI_CD_SETUP.md` for comprehensive guide

---

**Current Configuration Status**: ✓ Ready to build
**Branch**: claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
**Last Updated**: 2025-11-07
