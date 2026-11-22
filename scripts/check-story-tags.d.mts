export interface StoryEntry { type: string; title: string; name: string; tags?: string[] }
export interface TagExpectation { title: string; tag: string; stories: string[] }
export const EXPECTED_TAGS: TagExpectation[];
export function checkStoryTags(entries: Record<string, StoryEntry>, expected?: TagExpectation[]): string[];
