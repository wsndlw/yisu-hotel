import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*商户仪表盘页面，展示经营状况和酒店状态
*/
const Monitor = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default Monitor;
