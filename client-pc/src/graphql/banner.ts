import { gql } from '@apollo/client';

export const ALL_BANNERS = gql`
  query AllBannersQuery {
    allBannersQuery {
      id
      title
      imageUrl
      targetHotelId
      sort
      enabled
      startAt
      endAt
      createdAt
      updatedAt
    }
  }
`;

export const UPSERT_BANNER = gql`
  mutation UpsertBanner($id: ID, $input: BannerUpsertInput!) {
    upsertBanner(id: $id, input: $input) {
      id
      title
      imageUrl
      targetHotelId
      sort
      enabled
      startAt
      endAt
      updatedAt
    }
  }
`;

export const SET_BANNER_ENABLED = gql`
  mutation SetBannerEnabled($id: ID!, $enabled: Boolean!) {
    setBannerEnabled(id: $id, enabled: $enabled) {
      id
      enabled
      updatedAt
    }
  }
`;

export const DELETE_BANNER = gql`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id)
  }
`;
