/**
 * 统一的错误消息映射
 * 参考 drop 项目的 msg.ts
 */

import * as CODE from '../../common/constants/code';

export const msgMap: Record<number, string> = {
  // 基础消息
  [CODE.SUCCESS]: '操作成功',

  // 通用错误
  [CODE.VALIDATE_ERROR]: '参数校验失败',
  [CODE.NOT_EMPTY]: '参数不能为空',
  [CODE.UPDATE_ERROR]: '更新失败',
  [CODE.DELETE_ERROR]: '删除失败',
  [CODE.CREATE_ERROR]: '创建失败',

  // 认证相关
  [CODE.ACCOUNT_EXISTS]: '账号已存在',
  [CODE.ACCOUNT_NOT_EXISTS]: '账号不存在',
  [CODE.PASSWORD_ERROR]: '密码错误',
  [CODE.LOGIN_ERROR]: '登录失败',
  [CODE.REGISTER_ERROR]: '注册失败',
  [CODE.UNAUTHORIZED_ERROR]: '未授权，请先登录',
  [CODE.TOKEN_INVALID]: 'Token无效或已过期',

  // 用户相关
  [CODE.USER_NOT_EXIST]: '用户不存在',
  [CODE.USER_UPDATE_FAIL]: '用户信息更新失败',

  // 酒店相关
  [CODE.HOTEL_NOT_EXIST]: '酒店不存在',
  [CODE.HOTEL_CREATE_FAIL]: '酒店创建失败',
  [CODE.HOTEL_UPDATE_FAIL]: '酒店更新失败',
  [CODE.HOTEL_DELETE_FAIL]: '酒店删除失败',
  [CODE.HOTEL_SUBMIT_FAIL]: '酒店提交审核失败',
  [CODE.HOTEL_APPROVE_FAIL]: '酒店审核通过失败',
  [CODE.HOTEL_REJECT_FAIL]: '酒店驳回失败',
  [CODE.HOTEL_PUBLISH_FAIL]: '酒店发布失败',
  [CODE.HOTEL_OFFLINE_FAIL]: '酒店下线失败',
  [CODE.HOTEL_RESTORE_FAIL]: '酒店恢复失败',
  [CODE.HOTEL_STATUS_ERROR]: '酒店状态不允许此操作',

  // 房型相关
  [CODE.ROOM_TYPE_NOT_EXIST]: '房型不存在',
  [CODE.ROOM_TYPE_CREATE_FAIL]: '房型创建失败',
  [CODE.ROOM_TYPE_UPDATE_FAIL]: '房型更新失败',
  [CODE.ROOM_TYPE_DELETE_FAIL]: '房型删除失败',

  // 标签相关
  [CODE.TAG_NOT_EXIST]: '标签不存在',
  [CODE.TAG_CREATE_FAIL]: '标签创建失败',
  [CODE.TAG_UPDATE_FAIL]: '标签更新失败',
  [CODE.TAG_DELETE_FAIL]: '标签删除失败',
  [CODE.TAG_IN_USE]: '标签正在使用中，无法删除',

  // 设施相关
  [CODE.FACILITY_NOT_EXIST]: '设施不存在',
  [CODE.FACILITY_CREATE_FAIL]: '设施创建失败',
  [CODE.FACILITY_UPDATE_FAIL]: '设施更新失败',
  [CODE.FACILITY_DELETE_FAIL]: '设施删除失败',
  [CODE.FACILITY_IN_USE]: '设施正在使用中，无法删除',

  // OSS相关
  [CODE.OSS_CONFIG_ERROR]: 'OSS配置错误',
  [CODE.OSS_UPLOAD_FAIL]: '文件上传失败',
};

/**
 * 根据错误码获取错误消息
 */
export function getMsg(code: number, defaultMsg?: string): string {
  return msgMap[code] || defaultMsg || '操作失败';
}
