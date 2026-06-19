import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasource: {
    db: {
      provider: 'sqlite',
      url: 'file:./dev.db',
    },
  },
});
