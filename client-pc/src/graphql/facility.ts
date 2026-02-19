import { gql } from '@apollo/client';

/**
 * 设施类型枚举（与后端保持一致）
 */
export enum FacilityType {
  /** 标签类 - 用于酒店特色标记 */
  TAG = 'TAG',
  /** 设施类 - 用于酒店硬件设施 */
  FACILITY = 'FACILITY',
}

/**
 * 获取所有设施（管理员，包括已禁用）
 */
export const ALL_FACILITIES = gql`
  query AllFacilities {
    allFacilities {
      code
      message
      data {
        id
        name
        type
        category
        enabled
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * 获取启用的设施（商户/用户）
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
 * 新增/更新设施
 */
export const UPSERT_FACILITY = gql`
  mutation UpsertFacility($id: ID, $name: String!, $type: FacilityType!, $category: FacilityCategory!) {
    upsertFacility(input: { id: $id, name: $name, type: $type, category: $category }) {
      code
      message
    }
  }
`;

/**
 * 启用/禁用设施
 */
export const SET_FACILITY_ENABLED = gql`
  mutation SetFacilityEnabled($id: ID!, $enabled: Boolean!) {
    setFacilityEnabled(id: $id, enabled: $enabled) {
      code
      message
      data {
        id
        enabled
      }
    }
  }
`;

/**
 * 软删除设施
 */
export const DELETE_FACILITY = gql`
  mutation DeleteFacility($id: ID!) {
    deleteFacility(id: $id) {
      code
      message
      data {
        id
        enabled
      }
    }
  }
`;

/**
 * 硬删除设施
 */
export const HARD_DELETE_FACILITY = gql`
  mutation HardDeleteFacility($id: ID!) {
    hardDeleteFacility(id: $id) {
      code
      message
    }
  }
`;
