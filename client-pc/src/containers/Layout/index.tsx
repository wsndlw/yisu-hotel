import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*Layout容器
*/
const Layout = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default Layout;
