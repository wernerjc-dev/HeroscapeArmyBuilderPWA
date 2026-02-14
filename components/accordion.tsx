import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Accordion = ({ title, children, style, startOpen }) => {
  const [expanded, setExpanded] = useState(startOpen || false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={{...styles.container, ...style}}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={{...styles.title, fontSize: 16}}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10, borderBottomWidth: 1, borderColor: '#25292e' },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#25292e',
      fontWeight: 'bold',
  },
  title: { fontWeight: 'bold', color: '#fff', fontSize: 18 },
  content: { padding: 4 },
});

export default Accordion;
