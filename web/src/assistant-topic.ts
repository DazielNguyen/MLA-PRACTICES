export type AssistantTopic =
  | { kind: 'question'; id: number; label: string; study?: {
      page: 'session' | 'flashcards' | 'library' | 'results'; selected: string[]; revealed: boolean;
    } }
  | { kind: 'keyword'; id: string; label: string; study?: {
      page: 'keyword-study' | 'keyword-library'; seed?: number; mode?: 'cards' | 'match'; selected: string | null; revealed: boolean;
    } };

export const topicKey = (topic?: AssistantTopic) => topic ? `${topic.kind}:${topic.id}` : 'general';
