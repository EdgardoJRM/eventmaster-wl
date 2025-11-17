import React from 'react';
import { useTheme } from './ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  className = '',
  style,
}) => {
  const { theme } = useTheme();

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.layout.shadow,
    overflow: 'hidden',
    ...style,
  };

  return (
    <div style={cardStyle} className={className}>
      {title && (
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: 600,
            margin: 0,
            color: theme.colors.text,
          }}>
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: title || footer ? '1.5rem' : 0 }}>
        {children}
      </div>
      {footer && (
        <div style={{
          padding: '1.5rem',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.background,
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};

