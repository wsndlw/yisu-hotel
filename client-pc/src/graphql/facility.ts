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
        category
        enabled
      }
    }
  }
`;

