import { TagDto } from "../tag/tag-dto";


export interface PostUpdateDto{
    id: number;
    title: string;
    content: string;
    topicId: number;
    tags: TagDto[];
}