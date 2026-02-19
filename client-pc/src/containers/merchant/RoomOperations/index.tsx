import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*房型列表管理页面，用于运营信息以及日历夹克/库存的管理
*/
const RoomOperations = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default RoomOperations;
