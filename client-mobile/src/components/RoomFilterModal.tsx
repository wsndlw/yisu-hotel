import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 定义筛选条件的类型
export interface FilterOptions {
  priceRanges: string[];        // 价格：多选
  breakfast: string | undefined;// 早餐：单选
  area: string | undefined;     // 面积：单选
  services: string | undefined; // 服务：单选
  bedType: string[];            // （未启用）
  people: string | undefined;   // 入住人数：单选
  window: string | undefined;   // 有无窗：单选
  /* invoice: string[];
  vip: string[];
  promotion: string[];
  payment: string[]; */
}

interface RoomFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

const RoomFilterModal: React.FC<RoomFilterModalProps> = ({ visible, onClose, onApply }) => {
  // 初始筛选条件
  const [filters, setFilters] = useState<FilterOptions>({
    priceRanges: [],
    breakfast: undefined,
    area: undefined,
    services: undefined,
    bedType: [],
    people: undefined,
    window: undefined,
    /* invoice: [],
    vip: [],
    promotion: [],
    payment: [], */
  });

  // 1. 多选切换
  const toggleMultiOption = (category: keyof FilterOptions, option: string) => {
    // 只处理数组类型的字段（价格）
    if (Array.isArray(filters[category])) {
      setFilters(prev => {
        const currentOptions = prev[category] as string[];
        const newOptions = currentOptions.includes(option)
          ? currentOptions.filter(item => item !== option)
          : [...currentOptions, option];
        return { ...prev, [category]: newOptions };
      });
    }
  };

  // 2. 单选切换（
  const toggleSingleOption = (category: keyof FilterOptions, option: string) => {
    setFilters(prev => {
      // 点击已选中的选项则取消选中
      return { 
        ...prev, 
        [category]: prev[category] === option ? undefined : option 
      };
    });
  };

  // 清空所有筛选
  const handleClear = () => {
    setFilters({
      priceRanges: [],
      breakfast: undefined,
      area: undefined,
      services: undefined,
      bedType: [],
      people: undefined,
      window: undefined,
      /* invoice: [],
      vip: [],
      promotion: [],
      payment: [], */
    });
  };

  // 应用筛选
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // 渲染选项组
  const renderOptionGroup = (
    title: string, 
    category: keyof FilterOptions, 
    options: string[],
    type: 'single' | 'multi' = 'multi' // 默认多选
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              // 单选判断
              (type === 'single' ? filters[category] === option : (filters[category] as string[]).includes(option)) 
              && styles.optionActive
            ]}
            onPress={() => {
              type === 'single' 
                ? toggleSingleOption(category, option) 
                : toggleMultiOption(category, option);
            }}
          >
            <Text style={[
              styles.optionText,
              (type === 'single' ? filters[category] === option : (filters[category] as string[]).includes(option))
              && styles.optionTextActive
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>筛选</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          {renderOptionGroup('价格', 'priceRanges', [
            '¥200以下', '¥200-¥350', '¥350-¥400',
            '¥400-¥500', '¥500-¥750', '¥750-¥1000',
            '¥1000-¥1200', '¥1200以上'
          ])}

          {renderOptionGroup('早餐', 'breakfast', [
            '含早餐'
          ], 'single')}

          {renderOptionGroup('房间面积', 'area', [
            '≥25㎡', '≥30㎡'
          ], 'single')}

          {/* {renderOptionGroup('床型', 'bedType', [
            '大床', '双床'
          ], 'single')} */}

          {/* {renderOptionGroup('入住人数', 'people', [
            '2人', '3人', '4人', '5人', '6人'
          ], 'single')} */}

          {renderOptionGroup('预订服务', 'services', [
            '免费取消'
          ], 'single')}

          {renderOptionGroup('有无窗', 'window', [
            '有窗'
          ], 'single')}

          {/* {renderOptionGroup('发票', 'invoice', [
            '携程开票', '酒店开票'
          ])} */}

          {/* {renderOptionGroup('贵宾专享', 'vip', [
            '全部权益', '延迟退房'
          ])} */}

          {/* {renderOptionGroup('优惠促销', 'promotion', [
            '全部优惠促销'
          ])} */}

          {/* {renderOptionGroup('支付方式', 'payment', [
            '在线付款', '到店付款'
          ])} */}

          {/* {renderOptionGroup('适用人群', 'people', [
            '香港客人适用', '澳门客人适用', '台湾客人适用', '外宾适用'
          ])} */}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>清空</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>完成</Text>
          </TouchableOpacity>
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
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  optionActive: {
    backgroundColor: '#e6f7ff',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#1890ff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearBtn: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clearBtnText: {
    fontSize: 16,
    color: '#666',
  },
  applyBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#0086F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RoomFilterModal;
