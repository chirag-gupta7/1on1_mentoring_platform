import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>}
      <input
        ref={ref}
        id={id}
        className={clsx(
          'w-full bg-[#16213e] border rounded-lg px-4 py-3 text-white placeholder-gray-500 transition-colors outline-none',
          error ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
export default Input
