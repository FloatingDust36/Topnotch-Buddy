import { embeddingModel } from './client'

export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(texts.map(embedText))
  return results
}