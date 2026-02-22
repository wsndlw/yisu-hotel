// ⚠️ 注意：这里换成你刚才查到的局域网 IP
export const BASE_URL = 'http://192.168.1.11:3000';

//这是 GraphQL 的接口地址
export const GRAPHQL_ENDPOINT = `${BASE_URL}/graphql`;

// 导出图片前缀（如果后端返回的图片只有 /uploads/xxx，需要拼上这个）
export const IMAGE_BASE_URL = BASE_URL;