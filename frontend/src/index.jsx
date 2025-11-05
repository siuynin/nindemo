import React from 'react';
import ReactDOM from 'react-dom/client';

import { createStore } from 'polotno/model/store';
import { unstable_setAnimationsEnabled } from 'polotno/config';
import { createProject, ProjectContext } from './project';

import '@blueprintjs/core/lib/css/blueprint.css';
import './index.css';
import App from './App';
import './logger';
import { ErrorBoundary } from 'react-error-boundary';
import { versionService } from './services/versionService';

if (window.location.host !== 'ai-studio.com') {
  console.log(
    `%cWelcome to AI Studio! Thanks for your interest in the project!
This repository has many customizations from the default version.
I don't recommend to use it as starting point.
Instead, you can start from any official demos, e.g.: https://ai-studio.com/docs/full-canvas-editor
or direct sandbox: https://codesandbox.io/s/github/ai-studio-project/ai-studio-site/tree/source/examples/ai-studio-demo?from-embed.
But feel free to use this repository as a reference for your own project and to learn how to use AI Studio.`,
    'background: rgba(54, 213, 67, 1); color: white; padding: 5px;'
  );
}

unstable_setAnimationsEnabled(true);

const store = createStore({ key: 'nFA5H9elEytDyPyvKL7T' });
window.store = store;
store.addPage();

const project = createProject({ store });
window.project = project;

const root = ReactDOM.createRoot(document.getElementById('root'));

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

root.render(
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
      <App store={store} />
    </ProjectContext.Provider>
  </ErrorBoundary>
);

// Start version checking service in production
if (import.meta.env.PROD) {
  versionService.start();
  console.log('[Version Service] Started version checking service');
}
