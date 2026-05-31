export const buildChatId = (firstAppId: string, secondAppId: string) => {
  return [firstAppId, secondAppId].sort().join('_');
};
