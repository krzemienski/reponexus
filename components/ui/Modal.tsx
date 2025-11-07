import React, { useEffect } from 'react';
import {
  View,
  Modal as RNModal,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  dismissible?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  snapPoints = [SCREEN_HEIGHT * 0.7],
  dismissible = true,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > SCREEN_HEIGHT * 0.3 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        if (dismissible) {
          runOnJS(onClose)();
        }
      } else {
        translateY.value = withSpring(0, {
          damping: 50,
          stiffness: 300,
        });
      }
    });

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
        >
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          </Animated.View>
        </Pressable>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.bottomSheet, animatedStyle]}
            className="bg-dark-100 rounded-t-3xl"
          >
            <View className="w-12 h-1 bg-dark-300 rounded-full self-center mt-3 mb-4" />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    minHeight: SCREEN_HEIGHT * 0.3,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 40,
  },
});

export default Modal;
