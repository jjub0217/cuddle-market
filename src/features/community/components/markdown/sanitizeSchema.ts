import { defaultSchema } from 'rehype-sanitize'

// rehype-sanitize 스키마
// 추가할 태그가 있다면 tagNames에 확장 가능
export const mdSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'h1',
    'h2',
    'h3',
    'p',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'a',
    'code',
    'pre',
    'blockquote',
    'hr',
    'input',
    'img',
    'br',
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    a: [...(defaultSchema.attributes?.a || []), 'href', 'target', 'rel'],
    img: [
      ...(defaultSchema.attributes?.img || []),
      'src',
      'alt',
      'title',
      'width',
      'height',
      'loading',
      'referrerpolicy',
    ],
  },
  protocols: {
    ...(defaultSchema.protocols || {}),
    img: { src: ['http', 'https', 'data', 'blob'] },
  },
} as const
