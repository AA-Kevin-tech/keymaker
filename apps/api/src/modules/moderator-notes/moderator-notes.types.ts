export type AddModeratorNoteBody = {
  noteText: string;
  communityId?: string | null;
};

export type ModeratorNoteListItem = {
  id: string;
  userId: string;
  moderatorId: string;
  communityId: string | null;
  community: { id: string; name: string; slug: string } | null;
  noteText: string;
  createdAt: string;
  moderator: { id: string; username: string };
};
