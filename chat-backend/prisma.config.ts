import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  migrate: {
    url: 'file:./dev.db',
  },
});
