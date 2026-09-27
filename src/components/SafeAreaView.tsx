import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';


export const SafeAreaView: React.FC<ViewProps> = ({ style, children, ...props }) => {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
});

export default SafeAreaView;
