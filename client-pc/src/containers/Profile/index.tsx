import { useState, useEffect } from 'react';

import style from './index.module.css';

/**
*个人信息页面
*/
const Profile = ({}) => {
  const [state, setState] = useState();
  useEffect(() => {
    console.log(state, setState);
  }, []);
  return (<div className={style.container}>sss</div>);
};

export default Profile;
