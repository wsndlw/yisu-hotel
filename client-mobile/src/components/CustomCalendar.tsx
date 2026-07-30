import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 定义组件接收的参数类型
interface CustomCalendarProps {
    startDate: string;
    endDate: string;
    onSelectDate: (date: string) => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ startDate, endDate, onSelectDate }) => {
    // 当前显示的月份状态
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    // 获取当月有多少天
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 获取当月第一天是周几 (0是周日)
    const firstDay = new Date(year, month, 1).getDay();

    // 切换月份
    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    // 渲染每一天
    const renderDays = () => {
        const days = [];
        // 1. 填充前面的空白 (上个月的残留)
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // 2. 填充这个月的日期
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;
            let isInRange = false;

            if (startDate && endDate && dateStr > startDate && dateStr < endDate) {
                isInRange = true;
            }

            // 样式逻辑
            let bgStyle: any = {};
            let textStyle: any = { color: '#333' };
            let containerStyle: any = {};

            if (isStart || isEnd) {
                bgStyle = { backgroundColor: '#0086F6', borderRadius: 4 };
                textStyle = { color: '#fff', fontWeight: 'bold' };
            } else if (isInRange) {
                // 浅蓝色背景连接效果
                bgStyle = { backgroundColor: '#E6F7FF' };
                // 保持七列布局，避免根据整屏宽度计算后超出实际容器。
                containerStyle = { marginVertical: 2, marginHorizontal: 0 };
                textStyle = { color: '#0086F6' };
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const isPast = dateStr < todayStr;
            if (isPast) {
                textStyle = { color: '#ccc' };
            }

            days.push(
                <TouchableOpacity
                    key={dateStr}
                    style={[styles.dayCell, containerStyle, bgStyle]}
                    disabled={isPast}
                    onPress={() => onSelectDate(dateStr)}
                >
                    <Text style={[styles.dayText, textStyle]}>{i}</Text>
                    {isStart && <Text style={styles.dayLabel}>入住</Text>}
                    {isEnd && <Text style={styles.dayLabel}>离店</Text>}
                </TouchableOpacity>
            );
        }
        return days;
    };

    return (
        <View style={styles.calendarContainer}>
            {/* 头部：切换月份 */}
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{year}年 {month + 1}月</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* 星期栏 */}
            <View style={styles.weekRow}>
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <Text key={d} style={styles.weekText}>{d}</Text>
                ))}
            </View>

            {/* 日期网格 */}
            <View style={styles.daysGrid}>
                {renderDays()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        padding: 10
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    arrowBtn: {
        padding: 10
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 10
    },
    weekText: {
        flex: 1,
        textAlign: 'center',
        color: '#999',
        fontSize: 14
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    dayCell: {
        flexBasis: `${100 / 7}%`,
        maxWidth: `${100 / 7}%`,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500'
    },
    dayLabel: {
        fontSize: 9,
        color: '#fff',
        position: 'absolute',
        bottom: 2
    }
});

export default CustomCalendar;
