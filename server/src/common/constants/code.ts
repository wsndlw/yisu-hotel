// 成功状态吗
export const SUCCESS = 200;

// 通用 10000-10099
export const VALIDATE_ERROR = 10001;
export const NOT_EMPTY = 10002;
export const UPDATE_ERROR = 10003;
export const DELETE_ERROR = 10004;
export const CREATE_ERROR = 10005;

// 认证相关 10100-10199
export const ACCOUNT_EXISTS = 10100;
export const ACCOUNT_NOT_EXISTS = 10101;
export const PASSWORD_ERROR = 10102;
export const LOGIN_ERROR = 10103;
export const REGISTER_ERROR = 10104;
export const UNAUTHORIZED_ERROR = 10105;
export const TOKEN_INVALID = 10106;

// 用户相关 10200-10299
export const USER_NOT_EXIST = 10200;
export const USER_UPDATE_FAIL = 10201;

// 酒店相关10300-10399
export const HOTEL_NOT_EXIST = 10300;
export const HOTEL_CREATE_FAIL = 10301;
export const HOTEL_UPDATE_FAIL = 10302;
export const HOTEL_DELETE_FAIL = 10303;
export const HOTEL_SUBMIT_FAIL = 10304;
export const HOTEL_APPROVE_FAIL = 10305;
export const HOTEL_REJECT_FAIL = 10306;
export const HOTEL_PUBLISH_FAIL = 10307;
export const HOTEL_OFFLINE_FAIL = 10308;
export const HOTEL_RESTORE_FAIL = 10309;
export const HOTEL_STATUS_ERROR = 10310;

// 房型相关
export const ROOM_TYPE_NOT_EXIST = 10400;
export const ROOM_TYPE_CREATE_FAIL = 10401;
export const ROOM_TYPE_UPDATE_FAIL = 10402;
export const ROOM_TYPE_DELETE_FAIL = 10403;

// 标签/设施相关
export const TAG_NOT_EXIST = 10500;
export const TAG_CREATE_FAIL = 10501;
export const TAG_UPDATE_FAIL = 10502;
export const TAG_DELETE_FAIL = 10503;
export const TAG_IN_USE = 10504;
export const FACILITY_NOT_EXIST = 10510;
export const FACILITY_CREATE_FAIL = 10511;
export const FACILITY_UPDATE_FAIL = 10512;
export const FACILITY_DELETE_FAIL = 10513;
export const FACILITY_IN_USE = 10514;

// OSS相关
export const OSS_CONFIG_ERROR = 10600;
export const OSS_UPLOAD_FAIL = 10601;
