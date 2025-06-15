import { ReactionType } from "../enums/reaction-type";

export interface Reaction {
    id: number;
    userId: number;
    postId?: number;
    commentId?: number;
    type: ReactionType;
}
