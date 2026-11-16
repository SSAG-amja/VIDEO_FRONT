import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppAlertButton, useAlertStore } from '../store/useAlertStore';

export default function AppAlertModal() {
  const current = useAlertStore((state) => state.current);
  const dismiss = useAlertStore((state) => state.dismiss);

  if (!current) return null;

  const isCancelable = current.options?.cancelable !== false;

  const handleBackdropPress = () => {
    if (!isCancelable) return;
    current.options?.onDismiss?.();
    dismiss();
  };

  const handleButtonPress = (button: AppAlertButton) => {
    dismiss();
    button.onPress?.();
  };

  const isTwoButtons = current.buttons.length === 2;

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <Pressable style={styles.overlay} onPress={handleBackdropPress}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{current.title}</Text>
          {Boolean(current.message) && (
            <Text style={styles.message}>{current.message}</Text>
          )}

          <View style={[styles.buttonGroup, isTwoButtons && styles.buttonRow]}>
            {current.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';

              return (
                <Pressable
                  key={`${button.text ?? 'btn'}-${index}`}
                  style={({ pressed }) => [
                    styles.button,
                    isTwoButtons && styles.buttonFlex,
                    isCancel
                      ? styles.cancelButton
                      : isDestructive
                        ? styles.destructiveButton
                        : styles.confirmButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel
                        ? styles.cancelButtonText
                        : isDestructive
                          ? styles.destructiveButtonText
                          : styles.confirmButtonText,
                    ]}
                  >
                    {button.text || '확인'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: '#b5b5b5',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  buttonGroup: {
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  cancelButton: {
    backgroundColor: '#2a2a2c',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  confirmButton: {
    backgroundColor: '#FF5A36',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#cccccc',
  },
  destructiveButtonText: {
    color: '#ff6b6b',
  },
  confirmButtonText: {
    color: '#ffffff',
  },
});
