import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class OpenAiController {
  @Get('openapi.json')
  getOpenAiJson(@Res() res: Response) {
    res.sendFile(join(__dirname, '../..', 'openapi.json'));
  }

  @Get('.well-known/ai-plugin.json')
  getAiPluginJson(@Res() res: Response) {
    res.sendFile(join(__dirname, '../..', 'ai-plugin.json'));
  }
}
