import React from 'react';
import './SaveChangesBar.css';

interface SaveChangesBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSaveChanges: () => void;
}

const SaveChangesBar: React.FC<SaveChangesBarProps> = ({
  hasChanges,
  isSaving,
  onSaveChanges
}) => {
  if (!hasChanges && !isSaving) {
    return null;
  }

  return (
    <div className={`save-changes-bar ${hasChanges ? 'active' : ''}`}>
      <div className="save-changes-content">
        {isSaving ? (
          <div className="saving-indicator">
            <div className="saving-spinner"></div>
            <span>Saving changes...</span>
          </div>
        ) : (
          <>
            <div className="changes-message">
              <span>You have unsaved changes</span>
            </div>
            <button 
              className="save-button"
              onClick={onSaveChanges}
              disabled={isSaving}
            >
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveChangesBar; 