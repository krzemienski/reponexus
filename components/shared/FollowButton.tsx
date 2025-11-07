import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onPress,
  size = 'md',
  loading = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(1.1, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Button
        variant={isFollowing ? 'outline' : 'primary'}
        size={size}
        onPress={handlePress}
        loading={loading}
        disabled={loading}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </Animated.View>
  );
};

export default FollowButton;
