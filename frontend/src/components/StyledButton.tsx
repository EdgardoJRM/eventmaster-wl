'use client';

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function StyledButton({ variant = 'primary', children, className = '', ...props }: StyledButtonProps) {
  const variantStyles = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border-2 border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


