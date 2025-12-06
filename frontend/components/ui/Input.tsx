import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps, ViewStyle, TextStyle } from 'react-native';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({ containerStyle, inputStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle, style]}
        placeholderTextColor="#A8A29E"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1917',
  },
});

