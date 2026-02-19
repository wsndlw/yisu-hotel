import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*商户酒店列表页面，可以看到所有酒店的状态和信息。
*/
const Hotels = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default Hotels;
