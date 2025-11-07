import { withTiming, withSpring, withSequence } from 'react-native-reanimated';
import type { WithTimingConfig, WithSpringConfig } from 'react-native-reanimated';

/**
 * Default animation configs
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

export const defaultTimingConfig: WithTimingConfig = {
  duration: ANIMATION_DURATION.normal,
};

export const defaultSpringConfig: WithSpringConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
};

/**
 * Fade In Animation
 */
export const fadeIn = (duration = ANIMATION_DURATION.normal) => {
  'worklet';
  return withTiming(1, { duration });
};

/**
 * Fade Out Animation
 */
export const fadeOut = (duration = ANIMATION_DURATION.normal) => {
  'worklet';
  return withTiming(0, { duration });
};

/**
 * Slide In Up Animation
 */
export const slideInUp = (
  distance = 50,
  duration = ANIMATION_DURATION.normal
) => {
  'worklet';
  return withTiming(0, { duration });
};

/**
 * Slide In Down Animation
 */
export const slideInDown = (
  distance = 50,
  duration = ANIMATION_DURATION.normal
) => {
  'worklet';
  return withTiming(0, { duration });
};

/**
 * Slide Out Up Animation
 */
export const slideOutUp = (
  distance = 50,
  duration = ANIMATION_DURATION.normal
) => {
  'worklet';
  return withTiming(-distance, { duration });
};

/**
 * Slide Out Down Animation
 */
export const slideOutDown = (
  distance = 50,
  duration = ANIMATION_DURATION.normal
) => {
  'worklet';
  return withTiming(distance, { duration });
};

/**
 * Scale In Animation
 */
export const scaleIn = (duration = ANIMATION_DURATION.normal) => {
  'worklet';
  return withTiming(1, { duration });
};

/**
 * Scale Out Animation
 */
export const scaleOut = (duration = ANIMATION_DURATION.normal) => {
  'worklet';
  return withTiming(0, { duration });
};

/**
 * Press Feedback Animation (Scale + Opacity)
 */
export const pressFeedback = (pressed: boolean) => {
  'worklet';
  const scale = pressed ? 0.95 : 1;
  const opacity = pressed ? 0.7 : 1;

  return {
    scale: withSpring(scale, defaultSpringConfig),
    opacity: withTiming(opacity, { duration: ANIMATION_DURATION.fast }),
  };
};

/**
 * Press Scale Animation
 */
export const pressScale = (pressed: boolean, scale = 0.95) => {
  'worklet';
  return withSpring(pressed ? scale : 1, defaultSpringConfig);
};

/**
 * Bounce Animation
 */
export const bounce = () => {
  'worklet';
  return withSequence(
    withSpring(1.1, { damping: 10 }),
    withSpring(1, defaultSpringConfig)
  );
};

/**
 * Shake Animation
 */
export const shake = () => {
  'worklet';
  return withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

/**
 * Pulse Animation
 */
export const pulse = () => {
  'worklet';
  return withSequence(
    withTiming(1.05, { duration: ANIMATION_DURATION.fast }),
    withTiming(1, { duration: ANIMATION_DURATION.fast })
  );
};

/**
 * Rank Change Animation (for trending lists)
 */
export const rankChange = (direction: 'up' | 'down' | 'same') => {
  'worklet';
  if (direction === 'same') return withTiming(0, { duration: 0 });

  const offset = direction === 'up' ? -5 : 5;
  return withSequence(
    withTiming(offset, { duration: ANIMATION_DURATION.fast }),
    withSpring(0, defaultSpringConfig)
  );
};

/**
 * Shimmer Animation (for skeleton loaders)
 */
export const shimmer = (value: number) => {
  'worklet';
  return withSequence(
    withTiming(1, { duration: 1000 }),
    withTiming(0, { duration: 1000 })
  );
};

/**
 * Rotate Animation
 */
export const rotate = (degrees: number, duration = ANIMATION_DURATION.normal) => {
  'worklet';
  return withTiming(degrees, { duration });
};

/**
 * Loading Spinner Animation
 */
export const loadingSpinner = () => {
  'worklet';
  return withTiming(360, { duration: 1000 });
};

/**
 * Enter/Exit animations for modals
 */
export const modalEnter = {
  opacity: fadeIn(),
  translateY: slideInUp(100),
};

export const modalExit = {
  opacity: fadeOut(),
  translateY: slideOutDown(100),
};
