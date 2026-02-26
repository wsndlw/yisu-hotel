import { Select } from 'antd';
import { useMemo, useState } from 'react';
import { CITIES } from '../../constants/cities';

export default function CitySelect(props: {
  value?: string; // 城市编码
  onChange?: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [searchValue, setSearchValue] = useState('');

  // 搜索城市
  const filteredCities = useMemo(() => {
    if (!searchValue) return CITIES;

    const lowerKeyword = searchValue.toLowerCase();
    return CITIES.filter((city) => {
      return (
        city.name.includes(searchValue) ||
        city.pinyin.includes(lowerKeyword) ||
        city.province.includes(searchValue) ||
        (city.alias && city.alias.some((a) => a.toLowerCase().includes(lowerKeyword)))
      );
    });
  }, [searchValue]);

  // 生成选项
  const options = filteredCities.map((city) => ({
    label: `${city.name}（${city.province}）`,
    value: city.code,
    searchText: `${city.name}${city.pinyin}${city.province}${city.alias?.join('')}`,
  }));

  // 根据 code 显示城市名称
  const displayValue = useMemo(() => {
    if (!props.value) return undefined;
    const city = CITIES.find((c) => c.code === props.value);
    return city ? city.code : props.value;
  }, [props.value]);

  return (
    <Select
      showSearch
      value={displayValue}
      placeholder={props.placeholder || '请选择城市'}
      disabled={props.disabled}
      onChange={props.onChange}
      onSearch={setSearchValue}
      filterOption={false}
      options={options}
      className={props.className}
      style={{ width: '100%', ...props.style }}
    />
  );
}

