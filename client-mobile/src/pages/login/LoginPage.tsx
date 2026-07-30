import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from '../../navigation/navigationRef';
import { login } from '../../services/auth';
import styles from './LoginPage.styles';

type LoginPageProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '登录失败，请稍后重试';
}

export default function LoginPage({ navigation, route }: LoginPageProps) {
  const passwordInputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const normalizedUsername = username.trim();
    const nextUsernameError = normalizedUsername ? '' : '请输入用户名';
    const nextPasswordError = password ? '' : '请输入密码';

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);
    return !nextUsernameError && !nextPasswordError;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) return;

    Keyboard.dismiss();
    setSubmitError('');
    setSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      setSubmitting(false);

      if (route.params?.returnToExisting && navigation.canGoBack()) {
        navigation.goBack();
      } else if (route.params?.redirectTo === 'BookingConfirm') {
        navigation.replace('BookingConfirm');
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <StatusBar style="dark" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.title}>登录易宿</Text>
            <Text style={styles.subtitle}>登录后可预订酒店并查看历史订单</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>用户名</Text>
              <TextInput
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  if (usernameError) setUsernameError('');
                  if (submitError) setSubmitError('');
                }}
                style={[styles.input, usernameError ? styles.inputError : undefined]}
                placeholder="请输入用户名"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                editable={!submitting}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                accessibilityLabel="用户名"
              />
              {usernameError ? (
                <Text selectable style={styles.fieldError}>
                  {usernameError}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>密码</Text>
              <View style={[styles.passwordRow, passwordError ? styles.inputError : undefined]}>
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (passwordError) setPasswordError('');
                    if (submitError) setSubmitError('');
                  }}
                  style={styles.passwordInput}
                  placeholder="请输入密码"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  editable={!submitting}
                  onSubmitEditing={() => void handleSubmit()}
                  accessibilityLabel="密码"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? '隐藏密码' : '显示密码'}
                  hitSlop={8}
                  onPress={() => setShowPassword((visible) => !visible)}
                  disabled={submitting}
                >
                  <Text style={styles.passwordToggle}>{showPassword ? '隐藏' : '显示'}</Text>
                </Pressable>
              </View>
              {passwordError ? (
                <Text selectable style={styles.fieldError}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {submitError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text selectable style={styles.errorBannerText}>
                  {submitError}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="登录"
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !submitting ? styles.primaryButtonPressed : undefined,
                submitting ? styles.primaryButtonDisabled : undefined,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>登录</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate(
                  'Register',
                  route.params?.redirectTo
                    ? {
                        redirectTo: route.params.redirectTo,
                        returnToExisting: route.params.returnToExisting,
                      }
                    : undefined,
                )
              }
              disabled={submitting}
            >
              <Text style={styles.footerLink}>立即注册</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
