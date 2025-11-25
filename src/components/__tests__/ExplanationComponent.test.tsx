import { render, screen } from '@testing-library/react';
import { ExplanationComponent } from '../ExplanationComponent';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('ExplanationComponent', () => {
    it('should render explanation text', () => {
        const explanation = "This is a test explanation.";
        render(<ExplanationComponent explanation={explanation} />);
        expect(screen.getByText(explanation)).toBeInTheDocument();
    });

    it('should not render anything if explanation is null', () => {
        const { container } = render(<ExplanationComponent explanation={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});
