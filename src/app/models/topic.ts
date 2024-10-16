import { Post } from "./post";

export interface Topic {
    id: number;
    name: string;
    description?: string;
    posts: Post[];
}
