import React from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const KEYBOARD_ACCESSORY_ID = 'pinlm-keyboard-accessory';

// 2026.05.18 박현식
// iOS 키보드 위에 닫기 버튼이 있는 입력 보조 바를 표시한다.
export default function KeyboardAccessory() {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
      <View style={styles.container}>
        <View style={styles.grip} />
        <Pressable onPress={Keyboard.dismiss} style={styles.button}>
          <Ionicons name="chevron-down" size={22} color="#8E8E93" />
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: '#111111',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a2a',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
  },
  button: {
    height: 34,
    width: 38,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
});
