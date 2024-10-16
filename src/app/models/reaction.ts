import { ReactionType } from "../enums/reaction-type";

export interface Reaction {
    id: number;
    userId: number;
    postId?: number;
    commentid?: number;
    type: ReactionType;
}
