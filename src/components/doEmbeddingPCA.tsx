"use server"

import { PCA } from 'ml-pca';
import { v1 as aiplatform } from '@google-cloud/aiplatform';

const { PredictionServiceClient } = aiplatform;
import { helpers } from '@google-cloud/aiplatform';

interface EmbeddingResponse {
  embeddings: number[][];
}

export async function getEmbeddings(
  texts: string[],
  model = 'textembedding-gecko-multilingual',
  task = 'RETRIEVAL_DOCUMENT',
  apiEndpoint = 'us-central1-aiplatform.googleapis.com',
): Promise<EmbeddingResponse> {
  try {
    const clientOptions = { apiEndpoint: apiEndpoint };
    const endpoint = `projects/${process.env.GCP_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}`;

    const client = new PredictionServiceClient(clientOptions);

    const instances = texts.map((text) =>
      helpers.toValue({ content: text, taskType: task })
    );

    const request = { endpoint, instances: instances.filter((instance): instance is NonNullable<typeof instance> => instance !== null && instance !== undefined) };

    // Correctly await and destructure the response
    const response = await client.predict(request);
    const predictions = response[0].predictions ?? [];
    const embeddings: number[][] = [];

    for (const prediction of predictions ?? []) {
      const values = prediction?.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values ?? [];
      const embedding: number[] = values.map((value) => Number(value.numberValue));
      embeddings.push(embedding);
    }

    return { embeddings };

  } catch (error) {
    if(error instanceof Error){
      console.error("Error getting embeddings:", error);
      throw new Error(`Failed to get embeddings: ${error.message}`);
    }else{
      console.error("Unknown error getting embeddings:", error);
      throw new Error("Failed to get embeddings due to an unknown error");
    }
  }
}

export async function performPCA(data: number[][]) {
    try{
        const pca = new PCA(data);
        return pca.predict(data, { nComponents: 4 }).to2DArray();
    }catch (error) {
      if(error instanceof Error){
        console.error("Error getting PCA:", error);
        throw new Error(`Failed to get PCA: ${error.message}`);
      }else{
        console.error("Unknown error PCA:", error);
        throw new Error("Failed to get PCA due to an unknown error");
      }
    }
}