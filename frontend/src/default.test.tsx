import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

describe('HelloWorld', () => {
  test('renders "Hello, World!" message', () => {
    render(<div>Hello, World!</div>);
    const helloWorldElement = screen.getByText('Hello, World!');
    expect(helloWorldElement).toBeInTheDocument();
  });
});
