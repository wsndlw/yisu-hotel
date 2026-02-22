import React, { useState } from 'react';
import { Modal, Input, Checkbox, message } from 'antd';

interface RejectModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (reason: string) => Promise<void>;
}

const PRESET_REASONS = ['图片含有水印', '价格不合理', '地址不存在', '信息不实'];

const RejectModal: React.FC<RejectModalProps> = ({ open, onCancel, onOk }) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [extraText, setExtraText] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    const combined = [...selectedReasons, extraText?.trim()].filter(Boolean).join('；');
    if (!combined) {
      message.warning('驳回原因不可为空');
      return;
    }

    setConfirmLoading(true);
    try {
      await onOk(combined);
      // 重置状态
      setSelectedReasons([]);
      setExtraText('');
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    // 关闭时也可以重置状态，或者保留以便下次打开
    setSelectedReasons([]);
    setExtraText('');
    onCancel();
  };

  return (
    <Modal
      title="驳回酒店"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
    >
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>常见原因（可多选）：</div>
        <div style={{ marginBottom: 12 }}>
          {PRESET_REASONS.map((r) => (
            <div key={r} style={{ marginBottom: 6 }}>
              <Checkbox
                checked={selectedReasons.includes(r)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedReasons((prev) =>
                    checked ? [...prev, r] : prev.filter((x) => x !== r)
                  );
                }}
              >
                {r}
              </Checkbox>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 8, color: '#666' }}>补充说明：</div>
        <Input
          placeholder="例如：请补充酒店门头照片"
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
  );
};

export default RejectModal;
