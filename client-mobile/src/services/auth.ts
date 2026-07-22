import {
  EMAIL_LOGIN_MUTATION,
  EMAIL_REGISTER_MUTATION,
  LOGIN_MUTATION,
  ME_QUERY,
  REGISTER_MUTATION,
  SEND_EMAIL_CODE_MUTATION,
} from '../graphql/auth';
import { AuthUser, isAuthUser, useAuthStore } from '../store/authStore';
import { client } from '../utils/apollo';
import { clearAuthSession } from './authSession';

const SUCCESS_CODE = 200;

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

interface ApiResult<T> {
  code: number;
  message: string;
  data?: T | null;
}

interface AuthMutationData {
  accessToken: string;
  user: AuthUser;
}

interface LoginMutationData {
  login: ApiResult<AuthMutationData>;
}

interface RegisterMutationData {
  register: ApiResult<AuthMutationData>;
}

interface MeQueryData {
  me: ApiResult<AuthUser>;
}

interface SendEmailCodeMutationData {
  sendEmailCode: ApiResult<string>;
}

interface EmailLoginMutationData {
  emailLogin: ApiResult<AuthMutationData>;
}

interface EmailRegisterMutationData {
  emailRegister: ApiResult<string>;
}

export class AuthServiceError extends Error {
  readonly code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

function unwrapResult<T>(result: ApiResult<T> | null | undefined, fallbackMessage: string): T {
  if (!result) {
    throw new AuthServiceError(fallbackMessage);
  }
  if (result.code !== SUCCESS_CODE) {
    throw new AuthServiceError(result.message || fallbackMessage, result.code);
  }
  if (result.data === undefined || result.data === null) {
    throw new AuthServiceError(result.message || fallbackMessage, result.code);
  }
  return result.data;
}

function validateSession(payload: AuthMutationData, fallbackMessage: string): AuthSession {
  if (
    !payload ||
    typeof payload.accessToken !== 'string' ||
    payload.accessToken.length === 0 ||
    !isAuthUser(payload.user)
  ) {
    throw new AuthServiceError(fallbackMessage);
  }
  return { accessToken: payload.accessToken, user: payload.user };
}

async function saveSession(payload: AuthMutationData, fallbackMessage: string): Promise<AuthSession> {
  const session = validateSession(payload, fallbackMessage);

  // 避免上一个账号的缓存数据泄露给新登录账号。
  await client.clearStore();
  await useAuthStore.getState().setAuth(session.accessToken, session.user);
  return session;
}

/** 使用用户名和密码登录，并持久化认证会话。 */
export async function login(input: LoginInput): Promise<AuthSession> {
  const { data } = await client.mutate<LoginMutationData, { input: LoginInput }>({
    mutation: LOGIN_MUTATION,
    variables: { input },
  });
  const payload = unwrapResult(data?.login, '登录失败，请稍后重试');
  return saveSession(payload, '登录返回数据无效');
}

/** 注册消费者账号，并持久化服务端返回的认证会话。 */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const { data } = await client.mutate<RegisterMutationData, { input: RegisterInput }>({
    mutation: REGISTER_MUTATION,
    // 移动端不传 role，由服务端安全地使用默认 CUSTOMER。
    variables: { input },
  });
  const payload = unwrapResult(data?.register, '注册失败，请稍后重试');
  return saveSession(payload, '注册返回数据无效');
}

/** 从服务端获取当前用户，并同步本地用户快照。 */
export async function me(): Promise<AuthUser> {
  const { data } = await client.query<MeQueryData>({
    query: ME_QUERY,
    fetchPolicy: 'network-only',
  });
  const user = unwrapResult(data.me, '获取用户信息失败');
  if (!isAuthUser(user)) {
    throw new AuthServiceError('用户信息格式无效');
  }

  const token = useAuthStore.getState().token;
  if (token) {
    await useAuthStore.getState().setAuth(token, user);
  }
  return user;
}

/** 清除持久化会话、Zustand 状态与 Apollo 缓存。 */
export async function logout(): Promise<void> {
  await clearAuthSession();
}

/** 请求发送邮箱验证码。 */
export async function sendEmailCode(email: string): Promise<void> {
  const { data } = await client.mutate<SendEmailCodeMutationData, { email: string }>({
    mutation: SEND_EMAIL_CODE_MUTATION,
    variables: { email },
  });
  const result = data?.sendEmailCode;
  if (!result || result.code !== SUCCESS_CODE) {
    throw new AuthServiceError(result?.message || '验证码发送失败', result?.code);
  }
}

/** 使用邮箱验证码登录，并持久化认证会话。 */
export async function emailLogin(email: string, code: string): Promise<AuthSession> {
  const { data } = await client.mutate<
    EmailLoginMutationData,
    { email: string; code: string }
  >({
    mutation: EMAIL_LOGIN_MUTATION,
    variables: { email, code },
  });
  const payload = unwrapResult(data?.emailLogin, '邮箱登录失败，请稍后重试');
  return saveSession(payload, '邮箱登录返回数据无效');
}

/**
 * 完成邮箱验证码注册。后端仅返回 token，因此注册成功后使用邮箱密码登录，
 * 以获取完整用户信息并建立与普通登录一致的本地会话。
 */
export async function emailRegister(
  email: string,
  code: string,
  password: string,
): Promise<AuthSession> {
  const { data } = await client.mutate<
    EmailRegisterMutationData,
    { email: string; code: string; password: string }
  >({
    mutation: EMAIL_REGISTER_MUTATION,
    variables: { email, code, password },
  });
  unwrapResult(data?.emailRegister, '邮箱注册失败，请稍后重试');
  return login({ username: email, password });
}
