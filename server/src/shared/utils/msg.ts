/**
 * 统一的错误消息映射
 * 参考 drop 项目的 msg.ts
 */

import * as CodeConstants from '../../common/constants/code';

export const msgMap: Record<number, string> = {
  // 基础消息
  [CodeConstants.SUCCESS]: '操作成功',

  // 通用错误
  [CodeConstants.VALIDATE_ERROR]: '参数校验失败',
  [CodeConstants.NOT_EMPTY]: '参数不能为空',
  [CodeConstants.UPDATE_ERROR]: '更新失败',
  [CodeConstants.DELETE_ERROR]: '删除失败',
  [CodeConstants.CREATE_ERROR]: '创建失败',

  // 认证相关
  [CodeConstants.ACCOUNT_EXISTS]: '账号已存在',
  [CodeConstants.ACCOUNT_NOT_EXISTS]: '账号不存在',
  [CodeConstants.PASSWORD_ERROR]: '密码错误',
  [CodeConstants.LOGIN_ERROR]: '登录失败',
  [CodeConstants.REGISTER_ERROR]: '注册失败',
  [CodeConstants.UNAUTHORIZED_ERROR]: '未授权，请先登录',
  [CodeConstants.TOKEN_INVALID]: 'Token无效或已过期',

  // 用户相关
  [CodeConstants.USER_NOT_EXIST]: '用户不存在',
  [CodeConstants.USER_UPDATE_FAIL]: '用户信息更新失败',

  // 酒店相关
  [CodeConstants.HOTEL_NOT_EXIST]: '酒店不存在',
  [CodeConstants.HOTEL_CREATE_FAIL]: '酒店创建失败',
  [CodeConstants.HOTEL_UPDATE_FAIL]: '酒店更新失败',
  [CodeConstants.HOTEL_DELETE_FAIL]: '酒店删除失败',
  [CodeConstants.HOTEL_SUBMIT_FAIL]: '酒店提交审核失败',
  [CodeConstants.HOTEL_APPROVE_FAIL]: '酒店审核通过失败',
  [CodeConstants.HOTEL_REJECT_FAIL]: '酒店驳回失败',
  [CodeConstants.HOTEL_PUBLISH_FAIL]: '酒店发布失败',
  [CodeConstants.HOTEL_OFFLINE_FAIL]: '酒店下线失败',
  [CodeConstants.HOTEL_RESTORE_FAIL]: '酒店恢复失败',
  [CodeConstants.HOTEL_STATUS_ERROR]: '酒店状态不允许此操作',

  // 房型相关
  [CodeConstants.ROOM_TYPE_NOT_EXIST]: '房型不存在',
  [CodeConstants.ROOM_TYPE_CREATE_FAIL]: '房型创建失败',
  [CodeConstants.ROOM_TYPE_UPDATE_FAIL]: '房型更新失败',
  [CodeConstants.ROOM_TYPE_DELETE_FAIL]: '房型删除失败',

  // 标签相关
  [CodeConstants.TAG_NOT_EXIST]: '标签不存在',
  [CodeConstants.TAG_CREATE_FAIL]: '标签创建失败',
  [CodeConstants.TAG_UPDATE_FAIL]: '标签更新失败',
  [CodeConstants.TAG_DELETE_FAIL]: '标签删除失败',
  [CodeConstants.TAG_IN_USE]: '标签正在使用中，无法删除',

  // 设施相关
  [CodeConstants.FACILITY_NOT_EXIST]: '设施不存在',
  [CodeConstants.FACILITY_CREATE_FAIL]: '设施创建失败',
  [CodeConstants.FACILITY_UPDATE_FAIL]: '设施更新失败',
  [CodeConstants.FACILITY_DELETE_FAIL]: '设施删除失败',
  [CodeConstants.FACILITY_IN_USE]: '设施正在使用中，无法删除',

  // OSS相关
  [CodeConstants.OSS_CONFIG_ERROR]: 'OSS配置错误',
  [CodeConstants.OSS_UPLOAD_FAIL]: '文件上传失败',
};

/**
 * 根据错误码获取错误消息
 */
export function getMsg(code: number, defaultMsg?: string): string {
  return msgMap[code] || defaultMsg || '操作失败';
}
