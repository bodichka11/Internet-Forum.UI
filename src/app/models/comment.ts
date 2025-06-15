import { Reaction } from "./reaction";
import { User } from "./user";
export interface Comment {
    id: number;
    content: string;
    createdAt: Date;
    reactions: Reaction[];
    userId: number;
    postId: number;
    author?: User;
}
