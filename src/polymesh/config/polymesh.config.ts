import { registerAs } from '@nestjs/config';

export default registerAs('polymesh', () => {
  const { POLYMESH_NODE_URL, POLYMESH_MIDDLEWARE_URL, POLYMESH_MIDDLEWARE_API_KEY } = process.env;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const config = { nodeUrl: POLYMESH_NODE_URL! };

  if (!POLYMESH_MIDDLEWARE_URL || !POLYMESH_MIDDLEWARE_API_KEY) {
    return config;
  }

  return {
    ...config,
    middleware: { link: POLYMESH_MIDDLEWARE_URL, key: POLYMESH_MIDDLEWARE_API_KEY },
  };
});
