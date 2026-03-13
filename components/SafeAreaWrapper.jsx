import theme from '@/theme';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SafeAreaWrapper = ({ 
  children, 
  backgroundColor = theme.colors.background.primary,
  style = {},
  edges = ['top', 'left', 'right', 'bottom'],
  ...props 
}) => {
  return (
    <View 
      style={[
        {
          flex: 1,
          backgroundColor,
          width: '100%',
        },
        style
      ]} 
      {...props}
    >
      <SafeAreaView 
        style={{ 
          flex: 1,
          width: '100%',
        }}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </View>
  );
};

export default SafeAreaWrapper;