import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

const DetailPage = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    
    // 接收列表页传过来的 id
    const { id } = route.params || {};

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <Text style={styles.title}>酒店详情页</Text>
                <Text style={styles.text}>接收到的酒店ID: {id}</Text>
                
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
                    <Text style={styles.btnText}>返回列表</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16, color: '#666', marginBottom: 30 },
    btn: { backgroundColor: '#0086F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    btnText: { color: '#fff', fontSize: 16 }
});

export default DetailPage;