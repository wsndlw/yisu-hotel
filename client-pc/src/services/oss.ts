// import { useQuery } from '@apollo/client';
// import { GET_OSS_INFO } from '../graphql/oss';

// /**
//  * 获取 OSS 上传配置信息
//  */
// export const useOssInfo = () => {
//   const { data, loading, refetch } = useQuery(GET_OSS_INFO, {
//     fetchPolicy: 'no-cache',
//   });

//   return {
//     loading,
//     refetch,
//     data: data?.getOssInfo,
//     oss: data?.getOssInfo,
//   };
// };
