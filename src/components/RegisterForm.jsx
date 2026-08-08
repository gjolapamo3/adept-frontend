import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerUserSchema } from '../shared/schemas';

export const RegisterForm = ({ onRegister, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerUserSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    // Submit clean payload to API.
    await onRegister?.(data);
    onSuccess?.(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div>
        <input
          {...register('fullName')}
          placeholder="Full Name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
        />
        {errors.fullName ? (
          <p className="mt-1 text-xs text-red-600">{String(errors.fullName.message)}</p>
        ) : null}
      </div>

      <div>
        <input
          {...register('email')}
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{String(errors.email.message)}</p>
        ) : null}
      </div>

      <div>
        <input
          {...register('phone')}
          placeholder="Phone (e.g. +2348030000000)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-red-600">{String(errors.phone.message)}</p>
        ) : null}
      </div>

      <div>
        <input
          type="password"
          {...register('password')}
          placeholder="Password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-red-600">{String(errors.password.message)}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

export default RegisterForm;
