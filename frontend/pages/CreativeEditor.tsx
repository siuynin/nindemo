import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useNavigate } from 'react-router-dom';

import { createStore } from 'polotno/model/store';
import { unstable_setAnimationsEnabled } from 'polotno/config';
import { createProject, ProjectContext } from '../src/project';
 
import '../src/index.css';
import Canva from '../src/Canva';
import '../src/logger';
import { ErrorBoundary } from 'react-error-boundary';
import AdminTopBar from '../components/AdminTopBar'

unstable_setAnimationsEnabled(true);

const store = createStore({ key: 'nFA5H9elEytDyPyvKL7T', showCredit: false, });
window.store = store;
store.addPage();

const project = createProject({ store });
window.project = project;

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center', paddingTop: '40px' }}>
        <p>Something went wrong in the app.</p>
        <p>Try to reload the page.</p>
        <p>If it does not work, clear cache and reload.</p>
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

const CreativeEditor: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load BlueprintJS CSS chỉ cho trang này
  useEffect(() => {
    // Tạo link elements cho BlueprintJS CSS
    const coreLink = document.createElement('link');
    coreLink.rel = 'stylesheet';
    coreLink.href = 'https://unpkg.com/@blueprintjs/core@5.x/lib/css/blueprint.css';
    
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://unpkg.com/@blueprintjs/icons@5.x/lib/css/blueprint-icons.css';
    
    // Thêm vào head
    document.head.appendChild(coreLink);
    document.head.appendChild(iconsLink);
    
    // Ghi đè watermark function của Polotno
    const overrideWatermark = () => {
      if (window.Polotno && window.Polotno.utils) {
        window.Polotno.utils.drawWatermark = (context, width, height) => {
          context.font = "14px Arial";
          context.fillStyle = "#007aff";
          context.textAlign = "right";
          context.fillText("© AI Studio", width - 10, height - 10);
        };
      }
    };

    // Thử ghi đè ngay lập tức
    overrideWatermark();
    
    // Thử ghi đè sau một khoảng thời gian ngắn (khi Polotno đã load)
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(overrideWatermark, delay)
    );
    
    // Thay thế text "Powered by polotno.com" bằng JavaScript
    const replacePolotnoText = () => {
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('polotno.com')) {
          textNodes.push(node);
        }
      }
      
      textNodes.forEach(textNode => {
        if (textNode.textContent.includes('Powered by polotno.com')) {
          textNode.textContent = textNode.textContent.replace('Powered by polotno.com', 'Powered by AI Studio');
        }
        if (textNode.textContent.includes('polotno.com')) {
          textNode.textContent = textNode.textContent.replace(/polotno\.com/g, 'AI Studio');
        }
      });
    };

    // Chạy ngay lập tức
    replacePolotnoText();
    
    // Chạy lại sau khi DOM thay đổi
    const observer = new MutationObserver(() => {
      replacePolotnoText();
      overrideWatermark(); // Cũng thử ghi đè watermark khi DOM thay đổi
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Cleanup function
    return () => {
      document.head.removeChild(coreLink);
      document.head.removeChild(iconsLink);
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="creative-editor-container" style={{ width: '100vw',  display: 'flex', flexDirection: 'column' }}>
      {/* AdminTopBar với đầy đủ controls */}
      <AdminTopBar 
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        currentPage="creative-editor"
        onBackToDocument={() => navigate('/app/document')}
      />
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
};

export default CreativeEditor;
