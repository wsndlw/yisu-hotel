import { gql } from '@apollo/client';

/**
 * 获取启用的设施列表（商户/用户）
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
 * 新增/更新设施
 */
export const UPSERT_FACILITY = gql`
  mutation UpsertFacility($id: ID, $name: String!, $category: FacilityCategory!) {
    upsertFacility(input: { id: $id, name: $name, type: FACILITY, category: $category }) {
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
