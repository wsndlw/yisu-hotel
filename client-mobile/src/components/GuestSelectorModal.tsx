import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentCount: number;
  onSelect: (count: number) => void;
}

const GuestSelectorModal: React.FC<Props> = ({ visible, onClose, currentCount, onSelect }) => {
  const options = [1, 2, 3, 4, 5, 6];

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>选择入住人数</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          {options.map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.option, num === currentCount && styles.optionActive]}
              onPress={() => {
                onSelect(num);
                onClose();
              }}
            >
              <Text style={[styles.optionText, num === currentCount && styles.optionTextActive]}>
                {num}人
              </Text>
              {num === currentCount && (
                <Ionicons name="checkmark" size={20} color="#0086F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  optionActive: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextActive: {
    color: '#0086F6',
    fontWeight: 'bold',
  },
});

export default GuestSelectorModal;
