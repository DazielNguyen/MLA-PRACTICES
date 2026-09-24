import { createChatHandler } from '../server/chat.ts';

export const maxDuration = 60;
export default { fetch: createChatHandler() };
