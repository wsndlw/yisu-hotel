import React from 'react';
import type { UploadFile, UploadProps } from 'antd';
import { App, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import { useQuery } from '@apollo/client';
import { GET_OSS_INFO } from '../../graphql/oss';

/**
 * OSS 图片上传组件（使用阿里云OSS服务）
 */

export interface OSSImageUploadProps {
  value?: UploadFile[];
  onChange?: (fileList: UploadFile[]) => void;
  maxCount?: number;
  label?: string;
  imgCropAspect?: number;
  /** ImgCrop 内部裁剪弹窗（Modal）的 props，用于控制遮罩/zIndex/容器等 */
  cropModalProps?: any;
}

export default function OSSImageUpload(props: Readonly<OSSImageUploadProps>) {
  const { message } = App.useApp();
  // const { data, refetch } = useOssInfo();
  const { data, loading, refetch } = useQuery(GET_OSS_INFO, {
    fetchPolicy: 'no-cache',
  });

  const OSSData = data?.getOssInfo;

  const getKey = (file: UploadFile) => {
    const suffix = file.name.slice(file.name.lastIndexOf('.'));
    const key = `${OSSData?.dir}${file.uid}${suffix}`;
    const url = `${OSSData?.host}/${key}`;
    return { key, url };
  };

  const handleChange: UploadProps['onChange'] = ({ fileList }) => {
    const files = fileList.map((item) => ({
      ...item,
      url: OSSData ? getKey(item).url : item.url,
    }));
    props.onChange?.(files);
  };

  const getExtraData: UploadProps['data'] = (file) => {
    if (!OSSData) return {};
    const { key } = getKey(file as any);

    return {
      key,
      policy: OSSData.policy,
      'x-oss-signature': OSSData.signature,
      'x-oss-signature-version': OSSData.x_oss_signature_version,
      'x-oss-credential': OSSData.x_oss_credential,
      'x-oss-date': OSSData.expire,
      'x-oss-security-token': OSSData.security_token,
    };
  };

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (!OSSData) {
      message.error('OSS 签名未就绪，请稍后重试');
      return Upload.LIST_IGNORE;
    }

    // expire 是 x-oss-date（格式：YYYYMMDDTHHMMSSZ），这里简单处理：直接每次上传前 refetch
    // 如果你需要更精确的过期判断，可在后端额外返回 expiration 时间戳
    await refetch();
    return file;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    fileList: props.value,
    action: OSSData?.host,
    onChange: handleChange,
    data: getExtraData,
    beforeUpload,
    listType: 'picture-card',
    maxCount: props.maxCount,
  };

  return (
    <ImgCrop aspect={props.imgCropAspect || 1} modalProps={props.cropModalProps}>
      <Upload {...uploadProps}>{props.label || '上传图片'}</Upload>
    </ImgCrop>
  );
}
