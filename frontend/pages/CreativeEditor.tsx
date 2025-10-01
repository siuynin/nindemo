import React from 'react';

// Import the CaseComponent wrapper
import CaseComponentNoSSR from '../src/app/CaseComponentNoSSR';

const CreativeEditorPage: React.FC = () => {
  return (
    <div
      className="App showcaseContainer"
      style={{
        minHeight: '100vh',
        display: 'flex'
      }}
    >
      <CaseComponentNoSSR />
    </div>
  );
};

export default CreativeEditorPage;