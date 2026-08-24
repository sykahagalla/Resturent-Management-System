import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ImageFallback from './ImageFallback';

describe('ImageFallback Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<ImageFallback />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ImageFallback className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('renders the correct default icon size (md)', () => {
    const { container } = render(<ImageFallback />);
    // The UtensilsCrossed svg is inside the inner div
    const innerDiv = container.querySelector('svg');
    expect(innerDiv).toHaveClass('w-10 h-10');
  });

  it('renders the correct custom icon size (xl)', () => {
    const { container } = render(<ImageFallback iconSize="xl" />);
    const innerDiv = container.querySelector('svg');
    expect(innerDiv).toHaveClass('w-24 h-24');
  });
});
