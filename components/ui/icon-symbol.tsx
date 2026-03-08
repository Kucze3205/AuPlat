// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, Text, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'dark-mode',
  'cart.fill': 'shopping-cart',
  'tag.fill': 'sell',
  'person.fill': 'person',
  'rectangle.portrait.and.arrow.right': 'login',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

const WEB_FALLBACK_GLYPHS: Record<IconSymbolName, string> = {
  'house.fill': '⌂',
  'paperplane.fill': '➤',
  'sun.max.fill': '☀',
  'moon.fill': '☾',
  'cart.fill': '🛒',
  'tag.fill': '🏷',
  'person.fill': '👤',
  'rectangle.portrait.and.arrow.right': '↪',
  'chevron.left.forwardslash.chevron.right': '</>',
  'chevron.right': '›',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          {
            color: color as string,
            fontSize: size,
            lineHeight: size,
            fontWeight: '700',
          },
          style,
        ]}>
        {WEB_FALLBACK_GLYPHS[name]}
      </Text>
    );
  }

  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
