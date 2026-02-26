import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomCalendar from './Detail-CustomCalendar';

interface Props {
    visible: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
    onSelect: (date: string) => void;
    currentMonth?: Date; 
    onMonthChange?: (date: Date) => void; 
}

const DateSelectorModal: React.FC<Props> = ({ 
    visible, 
    onClose, 
    startDate, 
    endDate, 
    onSelect,
    currentMonth,
    onMonthChange 
}) => {
    // 内部状态，用于在弹窗打开时同步外部传入的月份
    const [internalCurrentMonth, setInternalCurrentMonth] = useState(() => {
        if (currentMonth) return new Date(currentMonth);
        return new Date();
    });

    // 当弹窗打开且传入的 currentMonth 变化时更新内部状态
    useEffect(() => {
        if (visible && currentMonth) {
            setInternalCurrentMonth(new Date(currentMonth));
        }
    }, [visible, currentMonth]);

    const formatDate = (s: string) => { 
        if (!s) return ''; 
        const d = new Date(s); 
        return `${d.getMonth() + 1}月${d.getDate()}日`; 
    };

    // 计算晚数
    const getNights = () => {
        if (!startDate || !endDate) return 0;
        return Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    };

    // 处理日期选择
    const handleDateSelect = (date: string) => {
        onSelect(date);
        
    };

    // 处理月份变化
    const handleMonthChange = (date: Date) => {
        setInternalCurrentMonth(date);
        onMonthChange?.(date);
    };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name='close' size={28} color='#333' />
                    </TouchableOpacity>
                    <Text style={styles.title}>选择日期</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.statusRow}>
                    <View>
                        <Text style={styles.label}>入住</Text>
                        <Text style={styles.date}>{startDate ? formatDate(startDate) : '请选择'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View>
                        <Text style={styles.label}>离店</Text>
                        <Text style={styles.date}>{endDate ? formatDate(endDate) : '请选择'}</Text>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }}>
                    <CustomCalendar 
                        startDate={startDate} 
                        endDate={endDate} 
                        onSelectDate={handleDateSelect}
                        currentMonth={internalCurrentMonth} // 传递当前月份
                        onMonthChange={handleMonthChange} // 传递月份变化回调
                    />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.btn, !endDate && styles.disabledBtn]}
                        disabled={!endDate}
                        onPress={onClose}
                    >
                        <Text style={styles.btnText}>
                            {endDate ? `完成 (${getNights()}晚)` : '请选择离店日期'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#f9f9f9'
    },
    label: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center'
    },
    date: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0086F6'
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#ddd'
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    btn: {
        backgroundColor: '#0086F6',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    disabledBtn: {
        backgroundColor: '#ccc'
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
});

export default DateSelectorModal;