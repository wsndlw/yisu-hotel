import { useState, useMemo } from 'react';

import styles from './index.module.css';
import { Button, Checkbox, Col, Divider, Drawer, Row, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoryConfig } from '../../constants/facilities';
import { useFacilities } from '../../services/facility';

interface FacilitySelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}
/**
*设施（标签）选择器，用于商户为酒店选择标签
*/
const FacilitySelector = ({ value = [], onChange }: FacilitySelectorProps) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  const { data: allFacilities } = useFacilities();

// 按分类分组设施
  const facilitiesByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {
      BASIC: [],
      ROOM: [],
      DINING: [],
      ENTERTAINMENT: [],
      BUSINESS: [],
      OTHER: [],
    };

    allFacilities.forEach((facility: any) => {
      const category = facility.category || 'OTHER';
      if (groups[category]) {
        groups[category].push(facility);
      } else {
        groups.OTHER.push(facility);
      }
    });

    return groups;
  }, [allFacilities]);

  // 已选设施的完整信息
  const selectedFacilities = useMemo(() => {
    return allFacilities.filter((f: any) => value.includes(f.id));
  }, [allFacilities, value]);

  // 打开抽屉
  const handleOpen = () => {
    setTempSelected([...value]);
    setDrawerOpen(true);
  };

  // 切换选中状态
  const toggleFacility = (id: string) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 确认选择
  const handleConfirm = () => {
    onChange?.(tempSelected);
    setDrawerOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelected([...value]);
    setDrawerOpen(false);
  };


  
   return (
    <div className={styles.facilitySelector}>
      {/* 展示态 */}
      <div className={styles.displayArea} onClick={handleOpen}>
        {selectedFacilities.length === 0 ? (
          <div className={styles.emptyText}>
            <PlusOutlined />
            <span>点击选择设施</span>
          </div>
        ) : (
          <div className={styles.selectedTags}>
            {selectedFacilities.map((facility: any) => {
              return (
                <Tag key={facility.id} color={ 'default'} >
                  {facility.name}
                </Tag>
              );
            })}
          </div>
        )}
      </div>

      {/* 编辑态：Drawer */}
      <Drawer
        title="选择设施"
        placement="right"
        width={720}
        open={drawerOpen}
        onClose={handleCancel}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" onClick={handleConfirm}>
                确定（已选 {tempSelected.length} 项）
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ paddingBottom: 60 }}>
          {Object.entries(categoryConfig).map(([category, config]) => {
            const facilities = facilitiesByCategory[category] || [];
            if (facilities.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: 24 }}>
                <Divider orientation="center" style={{ margin: '12px 0' }}>
                  <span style={{ color: '#000000ff', fontSize: 16, fontWeight: 500 }}>
                    {config.label}
                  </span>
                </Divider>
                <div style={{ padding: '0 16px' }}>
                  <Row gutter={[16, 16]}>
                    {facilities.map((facility: any) => (
                      <Col span={6} key={facility.id}>
                        <div
                          onClick={() => toggleFacility(facility.id)}
                          style={{
                            padding: '8px',
                            border: '1px solid #f0f0f0',
                            borderRadius: 4,
                            cursor: 'pointer',
                            backgroundColor: tempSelected.includes(facility.id) ? '#e6f7ff' : 'transparent',
                            borderColor: tempSelected.includes(facility.id) ? '#1890ff' : '#f0f0f0',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Checkbox checked={tempSelected.includes(facility.id)} style={{ pointerEvents: 'none', marginRight: 8 }} />
                          <span style={{ fontSize: 13, color: '#333' }}>{facility.name}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}

export default FacilitySelector;
