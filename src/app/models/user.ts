import { Comment } from "./comment";
import { Post } from "./post";
import { Reaction } from "./reaction";

export interface User {
    id: number;
    username: string;
    emailAddress: string;
    refreshToken: string;
    refreshTokenExpiryTime: Date;
    posts: Post[];
    reactions: Reaction[];
    comments: Comment[];
    imageUrl?: string;
}
