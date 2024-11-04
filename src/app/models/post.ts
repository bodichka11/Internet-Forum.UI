import { Comment } from "./comment";
import { Reaction } from "./reaction";
import { Tag } from "./tag";
import { Topic } from "./topic";
import { User } from "./user";

export interface Post {
    id: number;
    title: string;
    content: string;
    createdAt: Date;
    topicId: number;
    userId: number;
    comments: Comment[];
    reactions: Reaction[];
    tags: Tag[];
    images?: string[];
    author: User;
    topic: Topic;
    link: string;
}
