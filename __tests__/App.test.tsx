import React from 'react';
import App from '../app';
import '@testing-library/jest-dom/extend-expect';

describe('App', () => {
  it('renders without crashing', () => {
    <App />;
  });
});
