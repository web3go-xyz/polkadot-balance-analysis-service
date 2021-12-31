import { ApiProperty } from "@nestjs/swagger";
import { PageRequest } from "../base/pageRequest";

export class AccountRequest extends PageRequest {
    @ApiProperty({ default: '' })
    collection_id: string;

}