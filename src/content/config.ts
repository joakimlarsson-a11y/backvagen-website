import { defineCollection, z } from 'astro:content';

const vadIngar = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    kicker: z.string().optional(),
    lede: z.string(),
    order: z.number(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroImageCaption: z.string().optional(),
    sidebar: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
  }),
});

const dokument = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    file: z.string().optional(),
    date: z.string().optional(),
    category: z.string().optional(),
  }),
});

const faq = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    category: z.string(),
    order: z.number(),
  }),
});

const styrelsen = defineCollection({
  type: 'content',
  schema: z.object({
    role: z.string(),
    name: z.string(),
    house: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = {
  'vad-ingar': vadIngar,
  dokument,
  faq,
  styrelsen,
};
