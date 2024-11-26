import { OmitType } from '@nestjs/swagger';

import { InviteAgentToGroupDto } from '~/assets/dto/invite-agent-to-group.dto';

export class RemoveAgentFromGroupDto extends OmitType(InviteAgentToGroupDto, [
  'permissions',
] as const) {}
