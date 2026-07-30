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
import { register } from '../../services/auth';
import styles from './RegisterPage.styles';

type RegisterPageProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

type FieldErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '注册失败，请稍后重试';
}

export default function RegisterPage({ navigation, route }: RegisterPageProps) {
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!username.trim()) nextErrors.username = '请输入用户名';
    if (!password) {
      nextErrors.password = '请输入密码';
    } else if (password.length < 6) {
      nextErrors.password = '密码至少需要 6 位';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = '请再次输入密码';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = '两次输入的密码不一致';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) return;

    Keyboard.dismiss();
    setSubmitError('');
    setSubmitting(true);

    try {
      await register({ username: username.trim(), password });
      setSubmitting(false);
      if (route.params?.redirectTo === 'BookingConfirm') {
        navigation.reset({
          index: 1,
          routes: [{ name: 'MainTabs' }, { name: 'BookingConfirm' }],
        });
      } else if (route.params?.returnToExisting && navigation.canGoBack()) {
        navigation.pop(2);
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
            <Text style={styles.title}>创建账号</Text>
            <Text style={styles.subtitle}>注册后会自动登录，账号角色默认为消费者</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>用户名</Text>
              <TextInput
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  clearFieldError('username');
                }}
                style={[styles.input, fieldErrors.username ? styles.inputError : undefined]}
                placeholder="请输入用户名"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                textContentType="username"
                returnKeyType="next"
                editable={!submitting}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                accessibilityLabel="用户名"
              />
              {fieldErrors.username ? (
                <Text selectable style={styles.fieldError}>
                  {fieldErrors.username}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>密码</Text>
              <View style={[styles.passwordRow, fieldErrors.password ? styles.inputError : undefined]}>
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearFieldError('password');
                    if (fieldErrors.confirmPassword && value === confirmPassword) {
                      clearFieldError('confirmPassword');
                    }
                  }}
                  style={styles.passwordInput}
                  placeholder="至少 6 位密码"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  editable={!submitting}
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
              {fieldErrors.password ? (
                <Text selectable style={styles.fieldError}>
                  {fieldErrors.password}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                ref={confirmPasswordInputRef}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clearFieldError('confirmPassword');
                }}
                style={[styles.input, fieldErrors.confirmPassword ? styles.inputError : undefined]}
                placeholder="请再次输入密码"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                editable={!submitting}
                onSubmitEditing={() => void handleSubmit()}
                accessibilityLabel="确认密码"
              />
              {fieldErrors.confirmPassword ? (
                <Text selectable style={styles.fieldError}>
                  {fieldErrors.confirmPassword}
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
              accessibilityLabel="注册"
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
                <Text style={styles.primaryButtonText}>注册并登录</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>已有账号？</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.replace('Login');
                }
              }}
              disabled={submitting}
            >
              <Text style={styles.footerLink}>返回登录</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
