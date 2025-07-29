export const FILE_CONSTANTS = {
    PROFILE_IMAGE: {
      MAX_SIZE: 1 * 1024 * 1024, // 1MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as string[],
      MAX_WIDTH: 1024,
      MAX_HEIGHT: 1024,
    },
  } as const;