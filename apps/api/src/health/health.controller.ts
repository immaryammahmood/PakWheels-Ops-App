import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({summary: 'Process liveness only; does not assert database or storage readiness'})
  @ApiOkResponse({schema: {type: 'object', additionalProperties: false,
    required: ['status'], properties: {status: {type: 'string', enum: ['ok']}}}})
  health(): { status: 'ok' } { return {status: 'ok'}; }
}
