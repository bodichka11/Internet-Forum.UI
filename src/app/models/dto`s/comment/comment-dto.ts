import { Reaction } from "../../reaction";

export interface CommentDto{
    id: number;
    content: string;
    createdAt: Date;
    userId: number;
    postId: number;
    reactions: Reaction[];
}