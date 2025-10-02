interface RunwareImageRequest {
  taskType: 'imageInference';
  taskUUID: string;
  positivePrompt: string;
  width: number;
  height: number;
  model: string;
  numberResults: number;
  negativePrompt?: string;
  steps?: number;
  CFGScale?: number;
  seed?: number;
}

interface RunwareImageResponse {
  taskType: string;
  taskUUID: string;
  imageURL: string;
  imageUUID: string;
  NSFWContent: boolean;
}

interface RunwareUpscaleRequest {
  taskType: 'imageUpscale';
  taskUUID: string;
  inputImage: string;
  outputType: 'URL';
  outputFormat: 'jpg' | 'png';
  upscaleFactor: number;
}

interface RunwareUpscaleResponse {
  taskType: string;
  taskUUID: string;
  imageURL: string;
  imageUUID: string;
}

interface RunwareApiResponse {
  data: RunwareImageResponse[];
  errors?: any[];
}

class RunwareApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.runware.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: Omit<RunwareImageRequest, 'taskType' | 'taskUUID'>): Promise<RunwareImageResponse[]> {
    const taskUUID = crypto.randomUUID();
    
    const requestData: RunwareImageRequest[] = [{
      taskType: 'imageInference',
      taskUUID,
      ...request
    }];

    console.log('Runware API Key exists:', !!this.apiKey);
    console.log('Runware request data:', requestData);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Runware API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Runware API error response:', errorText);
        throw new Error(`Runware API error: ${response.status} - ${errorText}`);
      }

      const result: RunwareApiResponse = await response.json();
      console.log('Runware API result:', result);
      
      if (result.errors && result.errors.length > 0) {
        console.error('Runware API errors:', result.errors);
        throw new Error(`Runware API errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data || [];
    } catch (error) {
      console.error('Error calling Runware API:', error);
      throw error;
    }
  }

  async generateImages(requests: Omit<RunwareImageRequest, 'taskType' | 'taskUUID'>[]): Promise<RunwareImageResponse[]> {
    const requestData: RunwareImageRequest[] = requests.map(request => ({
      taskType: 'imageInference',
      taskUUID: crypto.randomUUID(),
      ...request
    }));

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Runware API error: ${response.status} - ${errorText}`);
      }

      const result: RunwareApiResponse = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Runware API errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data || [];
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    }
  }

  async upscaleImage(inputImage: string, upscaleFactor: number = 3): Promise<RunwareUpscaleResponse> {
    const taskUUID = crypto.randomUUID();
    
    const requestData: RunwareUpscaleRequest[] = [{
      taskType: 'imageUpscale',
      taskUUID,
      inputImage,
      outputType: 'URL',
      outputFormat: 'jpg',
      upscaleFactor
    }];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Runware API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Runware API errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data[0];
    } catch (error) {
      console.error('Error calling Runware upscale API:', error);
      throw error;
    }
  }
}

// Environment variable for API key
const RUNWARE_API_KEY = import.meta.env.VITE_RUNWARE_API_KEY || '';

// Export singleton instance
export const runwareApi = new RunwareApiService(RUNWARE_API_KEY);
export type { RunwareImageRequest, RunwareImageResponse, RunwareUpscaleRequest, RunwareUpscaleResponse };
export default RunwareApiService;