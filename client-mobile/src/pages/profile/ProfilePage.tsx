import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/navigationRef';
import { requireAuth } from '../../navigation/requireAuth';
import { clearAuthSession } from '../../services/authSession';
import { AuthUserRole, useAuthStore } from '../../store/authStore';
import styles from './ProfilePage.styles';

const ROLE_LABELS: Record<AuthUserRole, string> = {
  CUSTOMER: '消费者',
  MERCHANT: '商户',
  ADMIN: '管理员',
};

export default function ProfilePage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    Alert.alert('确认退出登录？', '退出后仍可浏览酒店，下单和查看订单时需重新登录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出登录',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await clearAuthSession();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!token || !user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>游</Text>
          </View>
          <Text style={styles.username}>游客</Text>
          <Text style={styles.secondaryText}>登录后可管理账号、查看历史订单并预订酒店</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            requireAuth(navigation, 'Profile', { returnToExisting: true })
          }
        >
          <Text style={styles.primaryButtonText}>登录 / 注册</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const displayName = user.username || user.email || '易宿用户';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{displayName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABELS[user.role]}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>用户 ID</Text>
          <Text selectable numberOfLines={1} style={styles.value}>{user.id}</Text>
        </View>
        {user.email ? (
          <View style={styles.row}>
            <Text style={styles.label}>邮箱</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.dangerButton}
        disabled={loggingOut}
        onPress={handleLogout}
      >
        {loggingOut ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text style={styles.dangerButtonText}>退出登录</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
