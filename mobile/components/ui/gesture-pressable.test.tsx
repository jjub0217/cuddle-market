import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { GesturePressable } from './gesture-pressable';

// ⚠️ **이 시험은 「진짜 눌리는가」를 못 본다.** 접근성 클릭은 네이티브가 보내는 것이라
//    실기기에서만 드러난다(#1115 는 그래서 폰으로 찾았다).
//
//    그래서 **「원인」을 직접 본다** — `activate` 액션이 달려 있는가, 그것을 쏘면
//    `onPress` 가 불리는가. 저장소 CLAUDE.md 의 교훈 그대로다:
//    「결과」로 시험을 쓰면 회귀를 심어도 통과한다.
//
// ⚠️ 이 시험이 지키는 것: 누가 `react-native-gesture-handler` 의 `Pressable` 을
//    **다시 바로 쓰면** 이 액션이 사라진다. 그때 여기가 빨개진다.

describe('GesturePressable', () => {
  it('activate 액션이 달려 있다', async () => {
    // 낭독기가 「두 번 탭」을 보낼 때 쓰는 표준 이름이다. 이게 없으면 탭이 갈 곳이 없다
    await render(
      <GesturePressable testID="target" onPress={() => {}}>
        <Text>누르기</Text>
      </GesturePressable>
    );

    const actions = screen.getByTestId('target').props.accessibilityActions;
    expect(actions).toEqual(expect.arrayContaining([{ name: 'activate' }]));
  });

  it('activate 를 쏘면 onPress 가 불린다', async () => {
    const onPress = jest.fn();
    await render(
      <GesturePressable testID="target" onPress={onPress}>
        <Text>누르기</Text>
      </GesturePressable>
    );

    await fireEvent(screen.getByTestId('target'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('다른 액션에는 onPress 가 안 불린다', async () => {
    const onPress = jest.fn();
    await render(
      <GesturePressable testID="target" onPress={onPress}>
        <Text>누르기</Text>
      </GesturePressable>
    );

    await fireEvent(screen.getByTestId('target'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(onPress).not.toHaveBeenCalled();
  });

  it('쓰는 쪽이 준 액션을 지우지 않고 activate 를 보탠다', async () => {
    await render(
      <GesturePressable
        testID="target"
        onPress={() => {}}
        accessibilityActions={[{ name: 'longpress' }]}
      >
        <Text>누르기</Text>
      </GesturePressable>
    );

    const actions = screen.getByTestId('target').props.accessibilityActions;
    expect(actions).toEqual(
      expect.arrayContaining([{ name: 'longpress' }, { name: 'activate' }])
    );
  });

  it('쓰는 쪽의 onAccessibilityAction 도 그대로 불린다', async () => {
    const onPress = jest.fn();
    const onAction = jest.fn();
    await render(
      <GesturePressable testID="target" onPress={onPress} onAccessibilityAction={onAction}>
        <Text>누르기</Text>
      </GesturePressable>
    );

    await fireEvent(screen.getByTestId('target'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
