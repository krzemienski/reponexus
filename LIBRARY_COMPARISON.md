# UI Component Library Comparison for Expo ~52.0 & React Native 0.75

**Research Date**: November 7, 2025
**Expo Version**: ~52.0.0 (React Native 0.76/0.77)
**Current Setup**: Already using React Native Paper v5.12.3

---

## Executive Summary

### Top Recommendation: **React Native Paper v5**

**Why React Native Paper:**

1. **Already Integrated** - Your project is already using React Native Paper v5.12.3, saving migration effort
2. **Excellent Expo Compatibility** - Works seamlessly with Expo SDK 52 (confirmed compatible with RN 0.76.6)
3. **Material Design 3** - Full Material You support with backward compatibility for MD2
4. **Production-Ready** - 14.1k GitHub stars, actively maintained by Callstack (official React Native partner)
5. **Complete Ecosystem** - 60+ components, excellent accessibility, comprehensive documentation
6. **Zero Risk** - Proven track record, stable releases, extensive community support

**When to Consider Alternatives:**
- **Tamagui** - If you need extreme performance optimization and are willing to invest in learning curve
- **Gluestack UI v3** - If you want Tailwind-style development (note: limited Expo 52 support currently)

---

## Detailed Comparison Table

| Criteria | React Native Paper | Tamagui | NativeBase | Gluestack UI |
|----------|-------------------|---------|------------|--------------|
| **Expo 52 Compatibility** | ✅ Excellent | ⚠️ Good (some setup) | ❌ Issues (Input broken on iOS) | ⚠️ Limited (Grid issues, targets SDK 53) |
| **GitHub Stars** | 14.1k | 13.3k | 20.4k | 4.6k |
| **Active Development** | ✅ Active | ✅ Very Active | ❌ Maintenance Mode | ✅ Active (v3 released) |
| **Component Count** | 60+ | 50+ | 60+ | 40+ |
| **Bundle Size** | Medium (tree-shakeable) | Small (compiler optimized) | Large | Small (copy-paste model) |
| **Performance** | Good | Excellent (10% of vanilla RN) | Good | Excellent |
| **Theming** | ✅ MD2/MD3, Dark/Light | ✅ Advanced, Dark/Light | ✅ Dark/Light | ✅ Tailwind-based |
| **Documentation** | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good |
| **Accessibility** | ✅ WCAG compliant, SR support | ✅ Good | ✅ Good | ✅ Good |
| **Web Support** | ✅ Via RN Web | ✅ Native (best-in-class) | ✅ Yes | ✅ Yes |
| **Learning Curve** | Low | Medium-High | Low | Medium |
| **Migration Risk** | None (already using) | Medium | High (maintenance mode) | Medium-High |

---

## Per-Library Analysis

### 1. React Native Paper

**Overview**: Material Design component library maintained by Callstack, the official React Native development partner.

**Pros:**
- ✅ Already integrated in your project (v5.12.3)
- ✅ Excellent Expo SDK 52 compatibility (confirmed with RN 0.76.6)
- ✅ Material Design 3 (Material You) with MD2 backward compatibility
- ✅ 60+ production-ready components
- ✅ Comprehensive documentation at callstack.github.io/react-native-paper
- ✅ WCAG compliant with full screen reader support (VoiceOver/TalkBack)
- ✅ Weekly downloads: 322,136 (highest among all options)
- ✅ Active releases (v5.14.5, 6 months ago)
- ✅ Maintained by Callstack (trusted industry partner)
- ✅ Tree-shakeable with Babel plugin for smaller bundles
- ✅ Right-to-left (RTL) language support
- ✅ New components in v5: SegmentedButtons, Tooltip, Drawer.CollapsedItem

**Cons:**
- ⚠️ Some minor issues with Menu component in Expo SDK 52 (edge cases)
- ⚠️ Jest testing issues with New Architecture (expo-font related, not Paper-specific)
- ⚠️ Bundle size larger than Tamagui (but optimizable)
- ⚠️ Material Design-specific (not ideal if you want custom design language)

**Expo SDK 52 Compatibility**: ✅ **Excellent** - Works with RN 0.76.6, minor edge case issues

**Component List** (Selected):
- **Buttons**: Button, FAB, IconButton, SegmentedButtons, Chip
- **Inputs**: TextInput, Checkbox, RadioButton, Switch, Searchbar
- **Navigation**: Drawer, BottomNavigation, Appbar, TabBar
- **Data Display**: Card, List, DataTable, Avatar, Badge
- **Feedback**: Dialog, Snackbar, Banner, ProgressBar, ActivityIndicator
- **Layout**: Surface, Divider, Portal
- **Overlays**: Menu, Modal, Tooltip

**Bundle Size**: Medium (~250KB minified) - Optimizable with Babel plugin

**GitHub**: https://github.com/callstack/react-native-paper
- Stars: 14.1k
- Forks: 2.2k
- Last Release: v5.14.5 (6 months ago)

**Documentation**: https://callstack.github.io/react-native-paper/

**Performance**: Good - Standard React Native performance, no specific optimizations

---

### 2. Tamagui

**Overview**: High-performance, universal UI kit with optimizing compiler for React Native and Web.

**Pros:**
- ✅ Exceptional performance (within 10% of vanilla React Native)
- ✅ Optimizing compiler reduces bundle size and runtime overhead
- ✅ Best-in-class web support with 15% Lighthouse improvement
- ✅ 50+ customizable components
- ✅ Advanced theming with nested themes and dark mode
- ✅ Platform-specific optimizations (atomic CSS on web, hoisted styles on native)
- ✅ Tailwind-inspired utility props
- ✅ Active development (13.3k stars)
- ✅ Excellent documentation
- ✅ Expo template available: `yarn create tamagui@latest --template expo-router`

**Cons:**
- ❌ Steeper learning curve (new paradigm)
- ❌ Requires Babel and Metro configuration
- ❌ More setup complexity vs. plug-and-play solutions
- ⚠️ Fewer weekly downloads (75,898 vs Paper's 322,136)
- ⚠️ Some reported dark/light theme prop issues (Oct 2024)
- ❌ Migration effort required (not currently in your project)
- ⚠️ Smaller community compared to Paper

**Expo SDK 52 Compatibility**: ✅ **Good** - Works with proper configuration

**Component List** (Selected):
- **Layout**: Stack, YStack, XStack, ZStack
- **Inputs**: Input, TextArea, Slider, Switch, Checkbox
- **Buttons**: Button
- **Overlays**: Dialog, Sheet, Popover, Tooltip
- **Navigation**: Tabs, Accordion
- **Feedback**: Progress, Spinner
- **Data Display**: Avatar, Card, Image, Paragraph, Heading
- **Forms**: Form, Label, Select

**Bundle Size**: Small - Compiler optimized, components flatten to minimal code

**GitHub**: https://github.com/tamagui/tamagui
- Stars: 13.3k
- Forks: 578
- Active development

**Documentation**: https://tamagui.dev

**Performance**: ✅ **Excellent** - Benchmarks show within 10% of vanilla RN speed

**Installation Complexity**: Medium-High
- Requires Babel plugin configuration
- Metro plugin for web support
- Font setup with expo-font
- Cache clearing on first run

---

### 3. NativeBase

**Overview**: Previously popular UI library, now in maintenance mode. Succeeded by Gluestack UI.

**Pros:**
- ✅ 60+ components
- ✅ 20.4k GitHub stars (historical popularity)
- ✅ Familiar API for existing users
- ✅ Accessibility features
- ✅ Dark mode support

**Cons:**
- ❌ **MAINTENANCE MODE** - Not actively developed (as of March 2023)
- ❌ **BROKEN ON EXPO SDK 52** - Input component doesn't work on iOS
- ❌ Team recommends migrating to Gluestack UI
- ❌ Limited future updates (only critical patches)
- ❌ New Architecture compatibility issues
- ❌ High risk for new projects

**Expo SDK 52 Compatibility**: ❌ **Poor** - Critical issues with Input on iOS

**Recommendation**: ❌ **DO NOT USE** for new development

**Migration Path**: Team recommends Gluestack UI as successor

**GitHub**: https://github.com/GeekyAnts/NativeBase
- Stars: 20.4k
- Forks: 2.4k
- Status: Maintenance Mode

**Documentation**: https://nativebase.io

---

### 4. Gluestack UI

**Overview**: Successor to NativeBase, using NativeWind (Tailwind CSS) for styling.

**Pros:**
- ✅ v3 released (August 2025) with modern features
- ✅ NativeWind v4.1 integration (Tailwind CSS for RN)
- ✅ Copy-paste component model (minimal dependencies)
- ✅ Small bundle size (modular architecture)
- ✅ Good performance benchmarks
- ✅ TypeScript-first
- ✅ Supports Next.js 15 + RSC (v3)
- ✅ Active development (4.6k stars)

**Cons:**
- ❌ **Limited Expo SDK 52 support** - Grid component broken with RN 0.76
- ⚠️ Requires react-native-svg 15.2.0 (specific version)
- ⚠️ v3 targets Expo SDK 53 (not yet released)
- ⚠️ Smaller community (4.6k stars)
- ⚠️ API changes between v2 and v3 (migration needed)
- ⚠️ Less mature than Paper or Tamagui
- ❌ Documentation still evolving

**Expo SDK 52 Compatibility**: ⚠️ **Limited** - Known issues with RN 0.76, targets SDK 53

**Recommendation**: ⚠️ Wait for Expo SDK 53 or use with caution

**Component List** (40+ components):
- Built with NativeWind/Tailwind CSS
- Copy-paste model (not npm package dependencies)
- Modular architecture

**Bundle Size**: Small - Copy-paste model minimizes bloat

**GitHub**: https://github.com/gluestack/gluestack-ui
- Stars: 4.6k
- Forks: 186
- Active development

**Documentation**: https://gluestack.io

**Version Info**:
- v2: Stable with NativeWind v4.1
- v3: Latest (Aug 2025), targets Expo SDK 53

---

## Installation Guides

### Recommended: React Native Paper (Already Installed)

Your project already has React Native Paper v5.12.3. To update to the latest:

```bash
# Update to latest v5
npm install react-native-paper@latest

# Ensure vector icons are updated
npm install @expo/vector-icons@latest react-native-vector-icons@latest
```

**Configuration** (Already in place):

```javascript
// App.tsx or _layout.tsx
import { PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider>
      {/* Your app content */}
    </PaperProvider>
  );
}
```

**Optional: Enable Tree Shaking** for smaller bundles:

```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-paper/babel', {
        components: true,
        config: true
      }]
    ]
  };
};
```

---

### Alternative: Tamagui (If Performance is Critical)

**Installation:**

```bash
# Install Tamagui
npm install tamagui @tamagui/config

# Install required dependencies
npm install @tamagui/babel-plugin @tamagui/metro-plugin
npx expo install expo-font @tamagui/font-inter
```

**Configuration:**

1. **Create tamagui.config.ts:**

```typescript
import { config } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

const tamaguiConfig = createTamagui(config);

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig;
```

2. **Update babel.config.js:**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
      'react-native-reanimated/plugin', // Keep at the end
    ],
  };
};
```

3. **Update metro.config.js:**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');

const config = getDefaultConfig(__dirname);

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css',
});
```

4. **Load fonts in _layout.tsx:**

```typescript
import { useFonts } from 'expo-font';
import { TamaguiProvider } from 'tamagui';
import config from './tamagui.config';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!loaded) return null;

  return (
    <TamaguiProvider config={config}>
      {/* Your app */}
    </TamaguiProvider>
  );
}
```

**First run:**

```bash
npx expo start -c
```

---

## Quick Start Examples

### React Native Paper

```typescript
import * as React from 'react';
import { View } from 'react-native';
import {
  Button,
  Card,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';

export default function Example() {
  const [text, setText] = React.useState('');
  const theme = useTheme();

  return (
    <View style={{ padding: 16 }}>
      <Card>
        <Card.Title title="Welcome" subtitle="React Native Paper" />
        <Card.Content>
          <Text variant="bodyMedium">
            Material Design 3 components
          </Text>

          <TextInput
            label="Email"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={{ marginTop: 16 }}
          />
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => console.log('Pressed')}>
            Submit
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}
```

**Theming:**

```typescript
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      {/* App content */}
    </PaperProvider>
  );
}
```

---

### Tamagui

```typescript
import { Button, Card, H2, Input, Paragraph, YStack } from 'tamagui';

export default function Example() {
  return (
    <YStack padding="$4" space="$4">
      <Card elevate size="$4" bordered>
        <Card.Header padded>
          <H2>Welcome</H2>
          <Paragraph theme="alt2">Tamagui UI Kit</Paragraph>
        </Card.Header>

        <Card.Footer padded>
          <YStack space="$2">
            <Input
              size="$4"
              placeholder="Email"
            />
            <Button theme="active">Submit</Button>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
```

**Dark Mode:**

```typescript
import { TamaguiProvider, Theme } from 'tamagui';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme}>
        {/* App content */}
      </Theme>
    </TamaguiProvider>
  );
}
```

---

## Migration Strategy

### If Staying with React Native Paper (Recommended)

**Current State**: Already using v5.12.3

**Action Plan**:
1. ✅ Update to latest v5.14.5
2. ✅ Add Babel plugin for tree shaking (optional)
3. ✅ Consider migrating from MD2 to MD3 theme (if using MD2)
4. ✅ Review new v5 components (SegmentedButtons, Tooltip)

**Migration Effort**: Minimal (0-4 hours)

### If Migrating to Tamagui

**Prerequisites**:
- Performance is critical requirement
- Team willing to learn new paradigm
- Need excellent web support
- Can invest in setup complexity

**Migration Steps**:
1. Install Tamagui dependencies
2. Configure Babel and Metro
3. Set up fonts
4. Create parallel components (gradual migration)
5. Replace Paper components incrementally
6. Test thoroughly on iOS, Android, Web

**Estimated Effort**: High (2-4 weeks for full migration)

**Risk Level**: Medium - Breaking changes, learning curve

### If Considering Gluestack UI

**Recommendation**: ⚠️ **WAIT** for Expo SDK 53 support

**Reason**: Current v3 targets SDK 53, v2 has compatibility issues with SDK 52

---

## Concerns and Caveats

### React Native Paper

**Minor Issues with Expo SDK 52**:
- ⚠️ Menu component edge cases (TypeError in some scenarios)
- ⚠️ Jest testing issues with New Architecture (expo-font related)
- ✅ Both are edge cases with workarounds

**Mitigation**:
- Use `npx expo-doctor@latest` to validate dependencies
- Monitor Paper GitHub for SDK 52 specific issues
- Update to latest v5.14.5 for bug fixes

**Overall Risk**: ✅ Low - Mature, stable, well-supported

### Tamagui

**Setup Complexity**:
- Requires Babel, Metro, font configuration
- Must clear cache on first run
- Platform-specific testing needed

**Learning Curve**:
- Different component API from standard RN
- New theming paradigm
- Compiler optimization concepts

**Overall Risk**: ⚠️ Medium - Higher complexity, but excellent results

### NativeBase

**Status**: ❌ **DO NOT USE**
- Maintenance mode
- Broken on Expo SDK 52 (iOS Input)
- Team recommends Gluestack instead

**Overall Risk**: ❌ High - Deprecated, compatibility issues

### Gluestack UI

**Expo SDK 52 Compatibility**:
- Grid component broken with RN 0.76
- Targets Expo SDK 53 (not yet released)
- Specific react-native-svg version required

**Overall Risk**: ⚠️ Medium-High - Wait for SDK 53 or use with caution

---

## Final Recommendation

### 🏆 Stick with React Native Paper v5

**Rationale**:

1. **Zero Migration Risk** - Already integrated and working
2. **Proven Compatibility** - Confirmed working with Expo SDK 52
3. **Industry Standard** - 14.1k stars, highest weekly downloads (322k)
4. **Complete Solution** - 60+ components cover all use cases
5. **Excellent Documentation** - Comprehensive guides and examples
6. **Accessibility First** - WCAG compliant, screen reader support
7. **Material Design 3** - Modern, beautiful, consistent UI
8. **Active Maintenance** - Callstack (official RN partner) backing
9. **Cost Effective** - No migration time/cost

**Action Items**:

```bash
# 1. Update to latest version
npm install react-native-paper@latest

# 2. Add tree-shaking (optional)
# Update babel.config.js with react-native-paper/babel plugin

# 3. Validate setup
npx expo-doctor@latest

# 4. Test app
npx expo start
```

**When to Reconsider**:
- If performance profiling shows UI is bottleneck → Evaluate Tamagui
- When Expo SDK 53 releases → Re-evaluate Gluestack UI v3
- If design requirements move away from Material Design → Consider Tamagui

---

## Additional Resources

### React Native Paper
- Documentation: https://callstack.github.io/react-native-paper/
- GitHub: https://github.com/callstack/react-native-paper
- Expo Guide: https://docs.expo.dev/guides/using-libraries/#react-native-paper
- Component Gallery: https://callstack.github.io/react-native-paper/docs/components/ActivityIndicator
- Migration Guide: https://callstack.github.io/react-native-paper/docs/guides/migration-guide-to-5.0/

### Tamagui
- Documentation: https://tamagui.dev
- Expo Guide: https://tamagui.dev/docs/guides/expo
- GitHub: https://github.com/tamagui/tamagui
- Benchmarks: https://tamagui.dev/docs/intro/benchmarks
- Template: `yarn create tamagui@latest --template expo-router`

### Gluestack UI
- Documentation: https://gluestack.io
- GitHub: https://github.com/gluestack/gluestack-ui
- Blog: https://gluestack.io/blogs/gluestack-v3-release

### Expo
- SDK 52 Changelog: https://expo.dev/changelog/2024-11-12-sdk-52
- React Native 0.77: https://expo.dev/changelog/2025-01-21-react-native-0.77
- Expo Doctor: `npx expo-doctor@latest`

---

## Comparison Summary

| Library | Status | Expo 52 | Recommendation |
|---------|--------|---------|----------------|
| **React Native Paper** | ✅ Active | ✅ Excellent | 🏆 **RECOMMENDED** |
| **Tamagui** | ✅ Active | ✅ Good | ⭐ Alternative (if performance critical) |
| **NativeBase** | ❌ Maintenance | ❌ Broken | ❌ Avoid |
| **Gluestack UI** | ✅ Active | ⚠️ Limited | ⏳ Wait for SDK 53 |

**Decision**: Continue with React Native Paper v5 - it's already working, well-supported, and meets all your requirements.

---

*Last Updated: November 7, 2025*
*Expo SDK: ~52.0.0*
*React Native: 0.75.4*
