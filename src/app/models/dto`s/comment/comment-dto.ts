import { Reaction } from "../../reaction";
import { User } from "../../user";

export interface CommentDto{
    id: number;
    content: string;
    createdAt: Date;
    userId: number;
    postId: number;
    reactions: Reaction[];
    author?: User;
}