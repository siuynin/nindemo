import React from 'react';

const CaseComponent = React.lazy(() => import('../components/case/CaseComponent'));

const CaseComponentNoSSR: React.FC = () => {
  return (
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <CaseComponent />
    </React.Suspense>
  );
};

export default CaseComponentNoSSR;
