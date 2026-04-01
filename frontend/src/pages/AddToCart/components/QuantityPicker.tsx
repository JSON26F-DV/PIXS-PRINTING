import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface QuantityPickerProps {
  quantity: number;
  minOrder: number;
  currentStock: number;
  onChange: (nextQuantity: number) => boolean;
}

type QuantityFormValues = {
  quantity: number;
};

const QuantityPicker: React.FC<QuantityPickerProps> = ({ quantity, minOrder, currentStock, onChange }) => {
  const schema = z.object({
    quantity: z.coerce
      .number()
      .int('Quantity must be a whole number')
      .min(minOrder, `Minimum order is ${minOrder}`)
      .max(currentStock, `Maximum available stock is ${currentStock}`),
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<QuantityFormValues>({
    defaultValues: { quantity },
    mode: 'onChange',
  });

  useEffect(() => {
    setValue('quantity', quantity);
  }, [quantity, setValue]);

  const submitQuantity = handleSubmit((values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid quantity';
      setError('quantity', { message });
      toast.error(message);
      return;
    }
    clearErrors('quantity');
    onChange(values.quantity);
  });

  const increment = () => {
    const next = quantity + 1;
    if (next <= currentStock) onChange(next);
  };

  const decrement = () => {
    const next = quantity - 1;
    if (next >= minOrder) onChange(next);
  };

  return (
    <form className="CartProductQuantity flex flex-col gap-2" onSubmit={submitQuantity}>
      <label className="text-xs font-semibold uppercase text-slate-500">Quantity</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={quantity <= minOrder}
          className={clsx(
            'rounded-lg border px-3 py-1 text-lg',
            quantity <= minOrder ? 'cursor-not-allowed border-slate-200 text-slate-300' : 'border-slate-300 text-slate-700',
          )}
        >
          -
        </button>
        <input
          type="number"
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          {...register('quantity')}
        />
        <button
          type="button"
          onClick={increment}
          disabled={quantity >= currentStock}
          className={clsx(
            'rounded-lg border px-3 py-1 text-lg',
            quantity >= currentStock
              ? 'cursor-not-allowed border-slate-200 text-slate-300'
              : 'border-slate-300 text-slate-700',
          )}
        >
          +
        </button>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
          Update
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Min: {minOrder} | Stock: {currentStock}
      </p>
      {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity.message}</p>}
    </form>
  );
};

export default QuantityPicker;
