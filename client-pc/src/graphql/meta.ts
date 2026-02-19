import { gql } from '@apollo/client';

/**
 * 获取启用的设施列表（用于商户选择）
 * 注意：现在标签和设施都在同一个表中，通过 type 字段区分
 */
export const FACILITIES = gql`
  query Facilities {
    facilities {
      code
      message
      data {
        id
        name
        type
        category
        enabled
      }
    }
  }
`;

/**
 * 兼容旧接口：获取标签（实际返回 type=TAG 的设施）
 */
export const TAGS = gql`
  query GetTagsForH5 {
    getTagsForH5 {
      code
      message
      data {
        id
        name
        type
        enabled
      }
    }
  }
`;
