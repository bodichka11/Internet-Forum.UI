import { TagDto } from "../tag/tag-dto";


export interface PostCreateDto{
    // userId: number;
    topicId: number;
    title: string;
    content: string;
    tags: TagDto[];
    // images: string[];
}