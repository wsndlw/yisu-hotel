import { gql } from '@apollo/client';

const ORDER_FIELDS = gql`
  fragment OrderFields on Order {
    id
    userId
    hotelId
    hotelName
    roomTypeId
    roomTypeName
    checkIn
    checkOut
    guestCount
    guestName
    guestPhone
    totalAmount
    status
    createdAt
    updatedAt
  }
`;

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ...OrderFields
    }
  }
  ${ORDER_FIELDS}
`;

export const MY_ORDERS_QUERY = gql`
  query MyOrders($pagination: OrderPaginationInput) {
    myOrders(pagination: $pagination) {
      items {
        ...OrderFields
      }
      total
      page
      pageSize
    }
  }
  ${ORDER_FIELDS}
`;

export const ORDER_DETAIL_QUERY = gql`
  query OrderDetail($id: ID!) {
    order(id: $id) {
      ...OrderFields
    }
  }
  ${ORDER_FIELDS}
`;

export const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($id: ID!) {
    cancelOrder(id: $id) {
      ...OrderFields
    }
  }
  ${ORDER_FIELDS}
`;

export const CREATE_ORDER = CREATE_ORDER_MUTATION;
