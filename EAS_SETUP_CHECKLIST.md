# EAS Build Setup Checklist

Use this checklist to track your setup progress.

## Phase 1: Prerequisites

- [ ] Node.js 20+ installed and verified (`node --version`)
- [ ] npm 10+ installed and verified (`npm --version`)
- [ ] Expo account created at https://expo.dev
- [ ] Git is configured and working
- [ ] On branch: `claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib`

## Phase 2: EAS CLI Setup

- [ ] Install EAS CLI globally
  ```bash
  npm install -g eas-cli
  ```
- [ ] Verify installation
  ```bash
  eas --version
  ```
- [ ] Login to Expo account
  ```bash
  eas login
  ```
- [ ] Verify login
  ```bash
  eas whoami
  ```

## Phase 3: Project Configuration

- [ ] Navigate to project directory
  ```bash
  cd /home/user/reponexus
  ```
- [ ] Run EAS build configuration
  ```bash
  eas build:configure
  ```
- [ ] Copy the generated project ID from the output
- [ ] Update `app.json` with the real project ID
  - Open `/home/user/reponexus/app.json`
  - Find: `"projectId": "repo-nexus-project"`
  - Replace with: `"projectId": "your-actual-project-id"`
- [ ] Verify configuration
  ```bash
  node -e "console.log(require('./app.json').expo.extra.eas.projectId)"
  ```

## Phase 4: GitHub Configuration

- [ ] Create Expo access token
  ```bash
  eas token:create --name "GitHub Actions CI/CD"
  ```
- [ ] Copy the token from the output (you won't see it again!)
- [ ] Add token to GitHub repository:
  - [ ] Go to repository on GitHub
  - [ ] Click Settings tab
  - [ ] Click "Secrets and variables" → "Actions"
  - [ ] Click "New repository secret"
  - [ ] Name: `EXPO_TOKEN`
  - [ ] Value: Paste the token
  - [ ] Click "Add secret"
- [ ] Verify secret is added (appears in secrets list)

## Phase 5: Local Dependencies

- [ ] Install project dependencies
  ```bash
  cd /home/user/reponexus
  npm install
  ```
- [ ] Run type checking
  ```bash
  npm run type-check
  ```
- [ ] Fix any TypeScript errors (if any)
- [ ] Run linter
  ```bash
  npm run lint
  ```
- [ ] Fix any lint errors (or run `npm run lint:fix`)

## Phase 6: First Build Test (Development)

- [ ] Start your first development build
  ```bash
  eas build --platform ios --profile development
  ```
- [ ] Wait for build to complete (10-20 minutes)
- [ ] Check build progress at https://expo.dev
- [ ] Download the build when complete
- [ ] Install on iOS Simulator:
  - [ ] Open iOS Simulator
  - [ ] Drag .app file to simulator
  - [ ] Launch and test the app

## Phase 7: CI/CD Test

- [ ] Commit current changes
  ```bash
  git add .
  git commit -m "feat: Configure EAS Build and CI/CD"
  ```
- [ ] Push to trigger CI/CD
  ```bash
  git push origin claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
  ```
- [ ] Monitor GitHub Actions:
  - [ ] Go to repository Actions tab
  - [ ] Watch the "EAS Build" workflow run
  - [ ] Verify all jobs pass (validate, build)
  - [ ] Check build summary
- [ ] Verify build in Expo dashboard
  - [ ] Go to https://expo.dev
  - [ ] Check Builds section
  - [ ] Verify new build appears

## Phase 8: Apple Developer Setup (For Preview/Production)

### Only complete if you need preview or production builds

- [ ] Apple Developer account created ($99/year)
- [ ] Register bundle identifiers in Apple Developer Portal:
  - [ ] `com.reponexus.ios.dev` (Development)
  - [ ] `com.reponexus.ios.preview` (Preview)
  - [ ] `com.reponexus.ios` (Production)
- [ ] Create certificates:
  - [ ] iOS Distribution certificate
  - [ ] Development certificate (optional)
- [ ] Create provisioning profiles:
  - [ ] Ad Hoc profile for preview builds
  - [ ] App Store profile for production builds
- [ ] Update `eas.json` submit configuration:
  - [ ] Replace `your-apple-id@example.com` with your Apple ID
  - [ ] Replace `1234567890` with your App Store Connect app ID
  - [ ] Replace `ABCDE12345` with your Apple Team ID

## Phase 9: Preview Build Test (Optional)

- [ ] Test preview build
  ```bash
  eas build --platform ios --profile preview
  ```
- [ ] Wait for build (15-25 minutes)
- [ ] Download the .ipa file
- [ ] Upload to TestFlight or install via Apple Configurator
- [ ] Test on physical device

## Phase 10: Production Build (When Ready)

- [ ] Verify all testing is complete
- [ ] Review app for App Store guidelines compliance
- [ ] Build production version
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Submit to App Store
  ```bash
  eas submit --platform ios
  ```
- [ ] Fill in App Store Connect metadata
- [ ] Submit for review

## Verification Checklist

After completing setup, verify:

- [ ] ✓ `eas.json` is valid JSON (run: `node -e "require('./eas.json')"`)
- [ ] ✓ `app.json` has real project ID
- [ ] ✓ EXPO_TOKEN secret is set in GitHub
- [ ] ✓ Can run `eas build:list` successfully
- [ ] ✓ At least one successful development build
- [ ] ✓ CI/CD workflow runs successfully on push
- [ ] ✓ Can trigger manual builds via GitHub Actions UI
- [ ] ✓ Build artifacts downloadable from Expo dashboard

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Check who's logged in
eas whoami

# List all builds
eas build:list

# Build for simulator (development)
eas build --platform ios --profile development

# Build for device (preview)
eas build --platform ios --profile preview

# Build for App Store (production)
eas build --platform ios --profile production

# View specific build
eas build:view <build-id>

# Download build
eas build:download <build-id>

# Check build status
eas build:list --status=in-progress

# Cancel a build
eas build:cancel <build-id>
```

## Troubleshooting

If you encounter issues:

1. Check `/home/user/reponexus/CI_CD_SETUP.md` for detailed troubleshooting
2. Check `/home/user/reponexus/EAS_BUILD_QUICK_START.md` for quick fixes
3. Visit Expo documentation: https://docs.expo.dev/build/introduction/
4. Check Expo forums: https://forums.expo.dev/

## Support Resources

- **Expo Dashboard**: https://expo.dev
- **Documentation**: `/home/user/reponexus/CI_CD_SETUP.md`
- **Quick Start**: `/home/user/reponexus/EAS_BUILD_QUICK_START.md`
- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Expo Forums**: https://forums.expo.dev/
- **Expo Discord**: https://chat.expo.dev/

---

**Progress Tracking**

- Setup Started: _______________
- First Build: _______________
- CI/CD Working: _______________
- Production Build: _______________

**Notes**

_Use this space to track issues, decisions, or important information:_

```




```

---

**Last Updated**: 2025-11-07
**Branch**: claude/repo-nexus-full-spec-011CUtwKfvFrMep9uP6RzEib
