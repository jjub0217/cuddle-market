// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
/** 내보내는 이유: 다른 파일이 아이콘 이름을 상수로 들고 있을 때 tsc가 검사하게 하려고(#806). */
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'person.crop.circle': 'person',
  heart: 'favorite-border',
  'heart.fill': 'favorite',
  ellipsis: 'more-vert',
  // 마이 목록의 빈 상태 아이콘. 웹은 lucide Package를 쓴다.
  shippingbox: 'inventory-2',
  plus: 'add',
  // 알림 종류별 아이콘(#806). 웹은 Lucide를, 앱은 MaterialIcons를 써서
  // 모양이 똑같지는 않다 — 같은 뜻의 아이콘을 고른 것이다.
  // 아이콘 여덟 개를 위해 SVG 라이브러리를 새로 들이지는 않는다.
  //
  // ⚠️ 왼쪽 키는 반드시 **실제로 있는 SF Symbol 이름**이어야 한다.
  // iOS판(icon-symbol.ios.tsx)은 이 이름을 SymbolView에 그대로 넘기기 때문에,
  // 지어낸 이름을 쓰면 안드로이드에서는 멀쩡한데 iOS에서만 아이콘이 안 뜬다.
  // 계획서에 적혀 있던 'bell.chat.new'·'bell.heart.broken' 같은 이름은 SF Symbol에
  // 없어서 tsc가 막았다 — 아래처럼 뜻이 같은 실제 이름으로 바꿨다.
  // 헤더 햄버거(#806). MaterialIcons 쪽은 'menu'인데, 왼쪽 키를 'menu'로 두면
  // 안 된다 — SF Symbol에 그런 이름이 없어서 위 ⚠️대로 tsc가 막는다(실제로 막혔다).
  // 세 줄 짜리 햄버거의 SF Symbol 이름은 'line.3.horizontal'이다.
  'line.3.horizontal': 'menu',
  bell: 'notifications-none',
  'plus.bubble': 'add-comment', // 계획서의 'bell.chat.new' 대체
  message: 'chat', // 계획서의 'bell.chat' 대체
  'heart.slash': 'heart-broken', // 계획서의 'bell.heart.broken' 대체
  tag: 'local-offer', // 계획서의 'bell.tag' 대체
  'exclamationmark.shield': 'gpp-maybe', // 계획서의 'bell.shield' 대체
  trash: 'delete', // 계획서의 'bell.trash' 대체
  'arrowshape.turn.up.left': 'reply', // 계획서의 'bell.reply' 대체
  'bubble.left': 'comment', // 계획서의 'bell.comment' 대체
} as IconMapping;

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
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
