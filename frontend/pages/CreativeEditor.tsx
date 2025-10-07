import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { createStore } from 'polotno/model/store';
import { unstable_setAnimationsEnabled } from 'polotno/config';
import { initPolotnoOverrides } from '../src/utils/polotno-override';
import { initMockKey } from '../src/utils/mock-polotno-key';
import { createProject, ProjectContext } from '../src/project';
 
import '../src/index.css';
import '../src/styles/credit-override.css';
import Canva from '../src/Canva';
import '../src/logger'; 
import { ErrorBoundary } from 'react-error-boundary'; 

unstable_setAnimationsEnabled(true);

const store = createStore({ key: ' ', showCredit: false });
window.store = store;
store.addPage();

const project = createProject({ store });
window.project = project;

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center', paddingTop: '40px' }}>
        <p>Something went wrong in the app.</p> 
        <button
          onClick={async () => {
            await project.clear();
            window.location.reload();
          }}
        >
          Clear cache and reload
        </button>
      </div>
    </div>
  );
}

const CreativeEditor = observer(() => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load BlueprintJS CSS chỉ cho trang này
  useEffect(() => {
    // Tạo link elements cho BlueprintJS CSS
    const coreLink = document.createElement('link');
    coreLink.rel = 'stylesheet';
    coreLink.href = '../styles/blueprint.css';
    
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = '../styles/blueprint-icons.css';
    
    // Thêm vào head
    document.head.appendChild(coreLink);
    document.head.appendChild(iconsLink);
    
    // Khởi tạo Polotno overrides để loại bỏ license check và watermark
    const observer = initPolotnoOverrides();
    
    // Initialize mock key to bypass license validation
    initMockKey();
    
    // Cleanup function
    return () => {
      document.head.removeChild(coreLink);
      document.head.removeChild(iconsLink);
      observer.disconnect();
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="creative-editor-container" style={{ width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <ErrorBoundary
        FallbackComponent={Fallback}
        onReset={(details) => {
          // Reset the state of your app so the error doesn't happen again
        }}
        onError={(e) => {
          if (window.Sentry) {
            window.Sentry.captureException(e);
          }
        }}
      >
        <ProjectContext.Provider value={project}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Canva store={store} />
          </div>
        </ProjectContext.Provider>
      </ErrorBoundary>
    </div>
  );
});

export default CreativeEditor;
