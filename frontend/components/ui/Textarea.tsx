import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps, ViewStyle, TextStyle } from 'react-native';

interface TextareaProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Textarea({ containerStyle, inputStyle, style, ...props }: TextareaProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.textarea, inputStyle, style]}
        placeholderTextColor="#A8A29E"
        multiline
        textAlignVertical="top"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1917',
    minHeight: 100,
  },
});

