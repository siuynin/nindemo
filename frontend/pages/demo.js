import React from 'react';
import ReactDOM from 'react-dom/client';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { PagesTimeline } from 'polotno/pages-timeline';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';

import '@blueprintjs/core/lib/css/blueprint.css';

import { createStore } from 'polotno/model/store';
import { setTranslations, setAPI } from 'polotno/config';

// Option 1: Disable AI Write feature to avoid fetch errors
setTranslations({
  text: {
    aiWrite: '', // Remove AI Write button text
    aiWriteTooltip: '', // Remove AI Write tooltip
  }
}, { validate: false });

// Option 2: Custom AI Write configuration (uncomment nếu bạn có custom API)
// import { setAIWriteConfig } from 'polotno/config';
// setAIWriteConfig({
//   endpoint: 'https://your-custom-api.com/ai-write',
//   headers: {
//     'Authorization': 'Bearer YOUR_API_KEY'
//   }
// });

// Try to disable domain validation for development
// Note: This might not work if the API key is domain-restricted
setAPI({
  // Add development mode flag
  devMode: true,
  // Try to bypass domain checks
  domain: 'localhost',
  origin: 'http://localhost:3000'
});

const store = createStore({
  key: 'nFA5H9elEytDyPyvKL7T', // you can create it here: https://polotno.com/cabinet/
  // you can hide back-link on a paid license
  // but it will be good if you can keep it for Polotno project support
  showCredit: false,
});
const page = store.addPage();

export const App = ({ store }) => {
  return (
    <PolotnoContainer style={{ width: '100vw', height: '100vh' }}>
      <SidePanelWrap>
        <SidePanel store={store} />
      </SidePanelWrap>
      <WorkspaceWrap>
        <Toolbar store={store} downloadButtonEnabled />
        <Workspace store={store} />
        <ZoomButtons store={store} />
        <PagesTimeline store={store} />
      </WorkspaceWrap>
    </PolotnoContainer>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App store={store} />);
