import { cva } from 'class-variance-authority'

export const notificationIconClass = cva('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', {
  variants: {
    type: {
      CHAT_NEW_ROOM: 'bg-blue-100',
      // CHAT_NEW_MESSAGE: 'bg-green-100',
      CHAT_NEW_MESSAGE: 'bg-blue-100',
      PRODUCT_FAVORITE_STATUS_CHANGED: 'bg-pink-100',
      PRODUCT_FAVORITE_PRICE_CHANGED: 'bg-yellow-100',
      ADMIN_SANCTION: 'bg-red-100',
      POST_DELETED: 'bg-gray-100',
      COMMENT_REPLY: 'bg-purple-100',
      POST_COMMENT: 'bg-indigo-100',
    },
  },
  defaultVariants: {
    type: 'CHAT_NEW_ROOM',
  },
})

export const notificationIconStrokeClass = cva('', {
  variants: {
    type: {
      CHAT_NEW_ROOM: 'stroke-[#2563EB]',
      // CHAT_NEW_MESSAGE: 'stroke-[#16A34A]',
      CHAT_NEW_MESSAGE: 'stroke-[#2563EB]',
      PRODUCT_FAVORITE_STATUS_CHANGED: 'stroke-[#EC4899]',
      PRODUCT_FAVORITE_PRICE_CHANGED: 'stroke-[#EAB308]',
      ADMIN_SANCTION: 'stroke-[#DC2626]',
      POST_DELETED: 'stroke-gray-400',
      COMMENT_REPLY: 'stroke-[#9333EA]',
      POST_COMMENT: 'stroke-[#6366F1]',
    },
  },
  defaultVariants: {
    type: 'CHAT_NEW_ROOM',
  },
})
