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
    const match = apiEndpoint.match(/(?<Location>\w+-\w+)/);
    const location = match ? match.groups.Location : 'us-central1';
    const endpoint = `projects/${process.env.GCP_PROJECT_ID}/locations/${location}/publishers/google/models/${model}`;

    const client = new PredictionServiceClient(clientOptions);

    const instances = texts.map((text) =>
      helpers.toValue({ content: text, taskType: task })
    );

    const request = { endpoint, instances };

    const [response] = await client.predict(request);

    const predictions = response.predictions;
    const embeddings: number[][] = [];

    for (const prediction of predictions) {
      const values = prediction.structValue.fields.embeddings.structValue.fields.values.listValue.values;
      const embedding: number[] = values.map((value) => Number(value.numberValue));
      embeddings.push(embedding);
    }

    return { embeddings };

  } catch (error) {
    // エラーオブジェクトをそのまま返すのではなく、適切なエラー処理を行う
    console.error("Error getting embeddings:", error);
    // エラーをスローして呼び出し元に伝える
    throw new Error(`Failed to get embeddings: ${error.message}`);
    // あるいは、デフォルト値を返す
    // return { embeddings: [] }; 
  }
}

export async function performPCA(data : number[][]) {
    try{
        const pca = new PCA(data);
        return pca.predict(data, { nComponents: 4 }).to2DArray();
    }catch{
        console.error("PCA Error");
        throw new Error("PCA Error");
    }
}
