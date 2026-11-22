import { buildChatId } from '@/utils/chat-id-builder/chat-id-builder';

describe('buildChatId', () => {
  describe('by default', () => {
    it('should create the same id regardless of participant order', () => {
      expect(buildChatId('zeta', 'alpha')).toBe('alpha_zeta');
      expect(buildChatId('alpha', 'zeta')).toBe('alpha_zeta');
    });
  });
});
