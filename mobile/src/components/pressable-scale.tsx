import * as Haptics from 'expo-haptics';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const APressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'light' | 'select' | 'none';
};

// Botón con escala al presionar (hilo de UI) y vibración corta.
export function PressableScale({ style, scaleTo = 0.96, haptic = 'light', onPressIn, onPressOut, onPress, children, ...rest }: Props) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        s.set(withTiming(scaleTo, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { damping: 12, stiffness: 260 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (Platform.OS !== 'web' && haptic !== 'none') {
          if (haptic === 'select') Haptics.selectionAsync();
          else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
      style={[style, anim]}>
      {children}
    </APressable>
  );
}
