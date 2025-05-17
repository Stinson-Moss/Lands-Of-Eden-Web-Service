import React from 'react';
import './NegativeConfirmationDialog.css';

interface CardInfo {
  title: string;
  question: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

interface NegativeConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  cardInfo: CardInfo;
}

const NegativeConfirmationDialog: React.FC<NegativeConfirmationDialogProps> = ({ cardInfo, onConfirm, onCancel }) => {

  return (
    <div className="confirmationOverlay">
      <div className="confirmationDialog">
        <h3>{cardInfo.title}</h3>
        <p>{cardInfo.question}</p>
        <div className="confirmationButtons">
              <button className="cancelButton" onClick={onCancel}>{cardInfo.cancelButtonText}</button>
              <button className="confirmButton" onClick={onConfirm}>{cardInfo.confirmButtonText}</button>
            </div>
          </div>
        </div>
      )
}

export default NegativeConfirmationDialog;
