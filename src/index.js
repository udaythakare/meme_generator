import React from 'react';
import { createRoot } from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import './index.css';

// Get the root DOM element where the app will be rendered
const container = document.getElementById('root');

// Create a root using the new createRoot API
const root = createRoot(container);

// Use the root to render your app
root.render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <App />
    </DndProvider>
  </React.StrictMode>
);
