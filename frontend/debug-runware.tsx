import React from 'react';

const DebugRunware: React.FC = () => {
  const apiKey = import.meta.env.VITE_RUNWARE_API_KEY;
  
  const debugInfo = {
    apiKeyValue: apiKey,
    apiKeyType: typeof apiKey,
    apiKeyLength: apiKey ? apiKey.length : 'N/A',
    isTruthy: !!apiKey,
    isEmptyString: apiKey === '',
    isUndefined: apiKey === undefined,
    isNull: apiKey === null,
    isPlaceholder: apiKey === 'your_runware_key_here'
  };
  
  const passesValidation = apiKey && apiKey !== 'your_runware_key_here';
  
  const testValidation = () => {
    try {
      console.log('Runware API Key configured:', !!apiKey);
      if (!apiKey || apiKey === 'your_runware_key_here') {
        throw new Error('Runware API key is not configured. Please add VITE_RUNWARE_API_KEY to your .env file.');
      }
      console.log('✅ Validation passed!');
      return true;
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug Runware API Key</h1>
      
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', margin: '10px 0' }}>
        <h3>API Key Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      
      <div style={{ 
        background: passesValidation ? '#d4edda' : '#f8d7da', 
        color: passesValidation ? '#155724' : '#721c24',
        padding: '15px', 
        borderRadius: '4px', 
        margin: '10px 0' 
      }}>
        <strong>{passesValidation ? '✅ API Key should pass validation' : '❌ API Key fails validation'}</strong>
      </div>
      
      <button 
        onClick={testValidation}
        style={{ 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          padding: '10px 20px', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }}
      >
        Test Validation Logic
      </button>
      
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', margin: '10px 0' }}>
        <h3>All VITE Environment Variables:</h3>
        <pre>
          {JSON.stringify(
            Object.keys(import.meta.env)
              .filter(key => key.startsWith('VITE_'))
              .reduce((obj, key) => {
                obj[key] = import.meta.env[key];
                return obj;
              }, {} as Record<string, any>),
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default DebugRunware;