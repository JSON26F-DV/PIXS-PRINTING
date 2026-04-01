import { z } from 'zod';

export const orderSchema = z.object({
  variantId: z.string().min(1, 'Please select a size/variant.'),
  quantity: z
    .number({ error: 'Quantity must be a number.' })
    .int('Quantity must be a whole number.')
    .positive('Quantity must be greater than 0.'),
  plateId: z.string().nullable(),
  printPosition: z.string().nullable(),
}).superRefine((data, ctx) => {
  // If a plate is selected, a position must also be chosen
  if (data.plateId && !data.printPosition) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a print position.',
      path: ['printPosition'],
    });
  }
});

export type OrderFormValues = z.infer<typeof orderSchema>;
