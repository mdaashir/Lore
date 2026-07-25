import { prisma } from '../config/prisma';
import { generateEmbedding } from './aiService';

export async function updateNoteEmbedding(noteId: string, content: string) {
  try {
    const embedding = await generateEmbedding(content);
    const embeddingStr = JSON.stringify(embedding);

    await prisma.note.update({
      where: { id: noteId },
      data: { embedding: embeddingStr },
    });
  } catch (error) {
    console.error('Failed to update note embedding:', error);
  }
}

export async function semanticSearch(
  query: string,
  workspaceId: string,
  limit: number = 10
) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const queryEmbeddingStr = JSON.stringify(queryEmbedding);

    const notes = await prisma.note.findMany({
      where: { workspaceId },
      select: {
        id: true,
        title: true,
        content: true,
        embedding: true,
        tags: true,
        updatedAt: true,
      },
    });

    const scoredNotes = notes
      .filter((note: any) => note.embedding)
      .map((note: any) => {
        const noteEmbedding = JSON.parse(note.embedding!);
        const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
        return { ...note, similarity };
      })
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

    return scoredNotes;
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}
