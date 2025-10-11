import React from 'react';
import ReactDOM from 'react-dom';

import Button from '../Button/Button';
import './Modal.css';

const modal = props => {
  const modalClasses = `modal${props.isSuccess ? ' modal--success' : ' modal--error'}`;
  
  return ReactDOM.createPortal(
    <div className={modalClasses}>
      <header className="modal__header">
        <h1>{props.title}</h1>
      </header>
      <div className="modal__content">{props.children}</div>
      <div className="modal__actions">
        <Button design="danger" mode="flat" onClick={props.onCancelModal}>
          Cancel
        </Button>
        <Button
          mode="raised"
          design={props.isSuccess ? "success" : ""}
          onClick={props.onAcceptModal}
          disabled={!props.acceptEnabled}
          loading={props.isLoading}
        >
          {props.isSuccess ? "OK" : "Accept"}
        </Button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default modal;
