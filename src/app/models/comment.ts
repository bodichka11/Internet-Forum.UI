import { Reaction } from "./reaction";
export interface Comment {
    id: number;
    content: string;
    createdAt: Date;
    reactions: Reaction[];
    userId: number;
    postId: number;
}
