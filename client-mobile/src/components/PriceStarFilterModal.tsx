// client-mobile/src/components/PriceStarFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 公用常量
export const PRICES = ['¥200以下', '¥200-¥350', '¥350-¥450', '¥450-¥550', '¥550-¥750', '¥750-¥1000', '¥1000-¥1500', '¥1500-¥2000', '¥2000以上'];
export const STARS = [
    { label: '2钻/星', desc: '经济' },
    { label: '3钻/星', desc: '舒适' },
    { label: '4钻/星', desc: '高档' },
    { label: '5钻/星', desc: '豪华' },
    { label: '金钻酒店', desc: '奢华体验' },
    { label: '铂钻酒店', desc: '超奢品质' }
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (price: string, star: string) => void;
    initialPrice?: string;
    initialStar?: string;
}

const PriceStarFilterModal = ({ visible, onClose, onConfirm, initialPrice = '', initialStar = '' }: Props) => {
    const [selectedPrice, setSelectedPrice] = useState(initialPrice);
    const [selectedStar, setSelectedStar] = useState(initialStar);

    // 每次打开弹窗时，同步外部传入的初始值
    useEffect(() => {
        if (visible) {
            setSelectedPrice(initialPrice || '');
            setSelectedStar(initialStar || '');
        }
    }, [visible, initialPrice, initialStar]);

    const togglePrice = (p: string) => setSelectedPrice(selectedPrice === p ? '' : p);
    const toggleStar = (s: string) => setSelectedStar(selectedStar === s ? '' : s);

    const handleConfirm = () => {
        onConfirm(selectedPrice, selectedStar);
        onClose();
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name='close' size={24} color='#333' />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>选择价格/星级</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={styles.sectionTitle}>价格区间</Text>
                        <View style={styles.gridContainer}>
                            {PRICES.map((p, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.gridItem, selectedPrice === p && styles.gridItemSelected]}
                                    onPress={() => togglePrice(p)}
                                >
                                    <Text style={[styles.gridText, selectedPrice === p && styles.gridTextSelected]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ height: 20 }} />
                        <Text style={styles.sectionTitle}>星级/钻级</Text>
                        <View style={styles.gridContainer}>
                            {STARS.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.gridItem, selectedStar === s.label && styles.gridItemSelected]}
                                    onPress={() => toggleStar(s.label)}
                                >
                                    <Text style={[styles.gridText, selectedStar === s.label && styles.gridTextSelected]}>{s.label}</Text>
                                    <Text style={styles.gridSubText}>{s.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.filterFooter}>
                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedPrice(''); setSelectedStar(''); }}>
                            <Text style={styles.resetBtnText}>清空</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.okBtn} onPress={handleConfirm}>
                            <Text style={styles.okBtnText}>完成</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '60%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridItem: {
        width: '30%',
        backgroundColor: '#f5f7fa',
        paddingVertical: 10,
        borderRadius: 6,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    gridItemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#0086F6',
        borderWidth: 1
    },
    gridText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center'
    },
    gridSubText: {
        fontSize: 11,
        color: '#999',
        marginTop: 2
    },
    gridTextSelected: {
        color: '#0086F6',
        fontWeight: 'bold'
    },
    filterFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    resetBtn: {
        flex: 1,
        marginRight: 10,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    resetBtnText: {
        color: '#333',
        fontSize: 16
    },
    okBtn: {
        flex: 2,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0086F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    okBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
});

export default PriceStarFilterModal;