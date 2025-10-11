import React, { Fragment } from 'react';

import Backdrop from '../Backdrop/Backdrop';
import Modal from '../Modal/Modal';

const successHandler = props => (
  <Fragment>
    {props.success && <Backdrop onClick={props.onHandle} />}
    {props.success && (
      <Modal
        title="Success!"
        onCancelModal={props.onHandle}
        onAcceptModal={props.onHandle}
        acceptEnabled
        isSuccess={true}
      >
        <p>{props.success.message || 'Operation completed successfully!'}</p>
      </Modal>
    )}
  </Fragment>
);

export default successHandler;
