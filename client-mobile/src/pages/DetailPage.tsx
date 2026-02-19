import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const DetailPage = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>这是详情页 (DetailPage)</Text>
      <Button 
        title="返回" 
        onPress={() => navigation.goBack()} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default DetailPage;