import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*酒店新建/编辑页面，包括基础信息和房型信息。在这里修改的信息将会触发审核
*/
const HotelEdit = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default HotelEdit;
