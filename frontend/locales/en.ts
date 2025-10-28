export const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo'
  },

  // TopBar
  topbar: {
    user: 'User',
    assistant: 'AI Assistant',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    admin: 'Administrator',
    userRole: 'User',
    loggingOut: 'Logging out...'
  },

  // Profile Modal
  profile: {
    title: 'Profile Information',
    name: 'Full Name',
    email: 'Email',
    emailNote: 'Email cannot be changed',
    phone: 'Phone Number',
    avatar: 'Avatar URL',
    role: 'Role',
    status: 'Status',
    createdAt: 'Account Created',
    lastLogin: 'Last Login',
    active: 'Active',
    inactive: 'Inactive',
    admin: 'Administrator',
    user: 'User',
    notUpdated: 'Not updated',
    updateSuccess: 'Profile updated successfully!',
    updateError: 'An error occurred while updating profile',
    saving: 'Saving...'
  },

  // Homepage
  homepage: {
    title: 'AI Studio',
    subtitle: 'Discover the power of AI with comprehensive tools for creativity and writing',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    explore: 'Explore',
    whyChoose: 'Why Choose AI Studio?',
    fastPowerful: 'Fast & Powerful',
    fastDesc: 'Advanced AI technology for quick and accurate results',
    easyToUse: 'Easy to Use',
    easyDesc: 'User-friendly interface, no technical experience required',
    creative: 'Creative',
    creativeDesc: 'Unleash your creative potential with diverse AI tools'
  },

  // Text to Speech
  textToSpeech: {
    title: 'Text to Speech',
    subtitle: 'Convert your text to natural-sounding speech with AI-powered voices',
    cloneVoiceDesc: 'Clone and replicate any voice with AI',
    ndhubDesc: 'Professional Vietnamese TTS service',
    elevenlabsDesc: 'High-quality AI voice generation',
    minmaxDesc: 'Advanced voice synthesis technology',
    inputTitle: 'Text Input',
    selectVoice: 'Select Voice',
    chooseVoice: 'Choose a voice...',
    enterText: 'Enter Text',
    textPlaceholder: 'Enter the text you want to convert to speech...',
    characters: 'characters',
    generate: 'Generate Speech',
    generating: 'Generating...',
    generatedFiles: 'Generated Files',
    files: 'files',
    availableVoices: 'Available Voices'
  },

  // Sidebar
  sidebar: {
    services: 'Services',
    imageCanvas: {
      title: 'Image Canvas',
      description: 'AI-powered image generation & editing'
    },
    writeAssistant: {
      title: 'Write Assistant',
      description: 'AI writing tools & text enhancement'
    },
    imageCreator: {
      title: 'Image Creator',
      description: 'AI image generation with Runware'
    },
    creativeEditor: {
      title: 'Creative Editor',
      description: 'Advanced AI-powered creative editor'
    },
    textToSpeech: {
      title: 'Text to Speech',
      description: 'Convert text to AI-powered speech'
    },
    documents: {
      title: 'Documents',
      description: 'Manage documents and templates'
    }
  },

  // Write Assistant
  writeAssistant: {
    title: 'Write Assistant',
    placeholder: 'Start writing your content...',
    aiAssistant: 'AI Assistant',
    processing: 'Processing...',
    error: 'An error occurred while processing the request',
    contextMenu: {
      rewrite: 'Rewrite',
      summarize: 'Summarize',
      translate: 'Translate',
      expand: 'Expand',
      improve: 'Improve',
      grammar: 'Fix Grammar',
      tone: 'Change Tone',
      simplify: 'Simplify'
    },
    contentGeneration: {
      placeholder: 'Describe the content you want to generate...',
      generate: 'Generate Content',
      generating: 'Generating content...'
    },
    success: {
      improved: 'Text improved successfully!',
      summarized: 'Text summarized successfully!',
      translated: 'Text translated successfully!',
      expanded: 'Text expanded successfully!',
      rewritten: 'Text rewritten successfully!',
      grammarFixed: 'Grammar fixed successfully!',
      toneChanged: 'Tone changed successfully!',
      simplified: 'Text simplified successfully!',
      contentGenerated: 'Content generated successfully!'
    }
  },

  // Image Creator
  imageCreator: {
    title: 'AI Image Creator',
    subtitle: 'Create stunning images with AI',
    description: 'Generate images from text using AI',
    placeholder: 'Describe the image you want to create...',
    generate: 'Generate Image',
    generating: 'Generating...',
    success: 'Image generated successfully!',
    error: 'Error generating image',
    downloadImage: 'Download Image',
    copyPrompt: 'Copy Prompt',
    promptCopied: 'Prompt copied!',
    model: 'Model',
    prompt: 'Prompt',
    promptPlaceholder: 'Describe the image you want to create... e.g., "A majestic dragon flying over a mystical forest at sunset"',
    createNewImage: 'Create New Image',
    selectModel: 'Select a model',
    imageSize: 'Image Size',
    numberResults: 'Number of Images',
    generateImage: 'Generate Image',
    generatedImages: 'Generated Images',
    noImagesYet: 'No images yet',
    startCreating: 'Start creating your first image!',
    tipMessage: 'Tip: Detailed descriptions yield better results',
    errorMessages: {
      promptRequired: 'Please enter a prompt and select a model',
      apiKeyMissing: 'API Key not configured. Please add VITE_RUNWARE_API_KEY to .env file',
      generateSuccess: 'Successfully generated {count} images!',
      generateError: 'Could not generate image: {error}'
    },
    sizeCategories: {
       square: 'Square',
       landscape: 'Landscape',
       cinematic: 'Cinematic',
       panoramic: 'Panoramic',
       film: 'Film',
       portrait: 'Portrait',
       mobile: 'Mobile'
     },
     readyToCreate: 'Ready to Create Magic?',
     imagesWillAppear: 'Your generated images will appear here',
     fillFormToStart: 'Fill out the form to get started',
     selectAIModel: 'Select AI Model',
     selected: 'Selected',
    apiKeyMissing: 'API key missing. Please add VITE_RUNWARE_API_KEY to .env file',
    gallery: {
      title: 'Image Gallery',
      empty: 'No images generated yet',
      download: 'Download',
      delete: 'Delete'
    }
  },
  imageCanvas: {
    title: 'Image Canvas',
    description: 'Edit and create images on canvas',
    toolbar: {
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      uploadImage: 'Upload Image',
      addText: 'Add Text',
      drawFreely: 'Draw Freely',
      magicFill: 'Magic Fill (Inpaint with text)',
      magicReplace: 'Magic Replace (Inpaint with image)',
      magicFillDisabled: 'Select 1 image for Magic Fill or 2 for Magic Replace',
      toggleGrid: 'Toggle Grid & Snapping',
      size: 'Size',
      spacing: 'Spacing'
    },
    replacementConfirmation: {
      generatedImage: 'Generated Image:',
      keepNew: 'Keep this image and remove the originals',
      keepBoth: 'Keep both the new and original items',
      discardNew: 'Discard this image and keep the originals'
    },
    promptModal: {
      title: 'Generate a New Image',
      description: 'Describe the image you want to create. Be as specific as you can for the best results.',
      placeholder: 'e.g., A futuristic city skyline at sunset, cyberpunk style',
      model: 'Model',
      generate: 'Generate Image',
      generating: 'Generating Image...'
    }
  },

  // Theme
  theme: {
    light: 'Light',
    dark: 'Dark',
    toggle: 'Toggle theme'
  },

  // Documents
  documents: {
    title: 'Documents',
    subtitle: 'Manage your documents and templates',
    myDocuments: 'My Documents',
    openaiTemplates: 'OpenAI Templates',
    search: 'Search',
    searchPlaceholder: 'Search by name...',
    type: 'Type',
    status: 'Status',
    share: 'Share',
    filters: 'Filters',
    name: 'Name',
    createdAt: 'Created At',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    createNew: 'Create New',
    noDocuments: 'No documents found',
    noTemplates: 'No templates found',
    deleteSuccess: 'Document deleted successfully',
    deleteError: 'Could not delete document',
    loadError: 'Could not load list',
    loginRequired: 'Login Required',
    loginMessage: 'Please login to view this page'
  },

  // Errors
  errors: {
    networkError: 'Network error',
    serverError: 'Server error',
    unauthorized: 'Unauthorized access',
    forbidden: 'Forbidden access',
    notFound: 'Not found',
    validationError: 'Validation error',
    unknownError: 'Unknown error'
  },

  // Bug Report
  bugReport: {
    reportBug: 'Report Bug',
    title: 'Bug Report',
    description: 'Description',
    stepsToReproduce: 'Steps to Reproduce',
    expectedBehavior: 'Expected Behavior',
    actualBehavior: 'Actual Behavior',
    priority: 'Priority',
    currentUrl: 'Current URL',
    browserInfo: 'Browser Info',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    cancel: 'Cancel',
    submitBugReport: 'Submit Bug Report',
    submitting: 'Submitting...',
    pleaseLoginFirst: 'Please login first to report bugs',
    titleAndDescriptionRequired: 'Title and description are required',
    bugReportSubmitted: 'Bug report submitted successfully!',
    errorSubmittingBugReport: 'Error submitting bug report',
    networkError: 'Network error. Please try again.',
    loginRequiredForBugReport: 'Please login to report bugs. This helps us track and respond to your reports.',
    enterBugTitle: 'Enter a brief title for the bug',
    describeBugDetail: 'Describe the bug in detail',
    stepsToReproducePlaceholder: '1. Go to...\n2. Click on...\n3. See error',
    whatShouldHappen: 'What should happen?',
    whatActuallyHappens: 'What actually happens?'
  },

  // Install Prompt
  installApp: 'Install App',
  installAppDescription: 'Faster access, works offline',
  install: 'Install',
  later: 'Later'
};

export type TranslationKeys = typeof en;