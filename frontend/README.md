# AegisPath Interactive Dashboard

The frontend for AegisPath is a modern React application powered by Vite. It provides an intuitive, drag-and-drop canvas for security engineers to build, configure, and visualize threat topologies.

## ✨ Key Features

*   **ReactFlow Canvas:** A highly interactive, performant node-based workspace for assembling network diagrams.
*   **Premium Cybersecurity UX/UI:** Designed with a sleek dark mode, neon color palettes, and glassmorphism elements to deliver a professional "Hacker-chic" aesthetic.
*   **Native HTML5 Drag & Drop:** Seamlessly drag pre-configured components (Firewalls, Servers, Workstations) from the palette onto the canvas. Coordinates are automatically projected.
*   **Contextual Inspector:** Clicking any node reveals an Inspector pane to tune specific stateful attributes like IP addresses, CVSS vulnerability scores, and port configurations.
*   **Real-time Visual Feedback:** When a simulation is executed via the backend API, the resulting attack path is visually highlighted on the canvas, illuminating the compromised route.

## 📂 Project Structure

```text
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components (Canvas, Sidebar, Inspector)
│   ├── App.jsx       # Main application layout and state management
│   ├── index.css     # Global styles and design system tokens
│   └── main.jsx      # React entry point
├── index.html        # HTML template
├── package.json      # NPM dependencies and scripts
├── README.md         # This documentation
└── vite.config.js    # Vite bundler configuration
```

## 🚀 Setup & Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install NPM dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will automatically open in your default browser at `http://localhost:5173`.

4.  **Build for Production:**
    To generate an optimized production build, run:
    ```bash
    npm run build
    ```
    The output will be placed in the `dist/` directory.

## 🎨 Design System & Customization

The UI is driven by standard CSS located in `src/index.css`. The aesthetic heavily relies on CSS variables for consistent theming. 

*   **Colors:** Neon blues, synthetic pinks, and deep space grays.
*   **Typography:** Modern sans-serif stacks optimized for legibility in complex UI layouts.
*   **Animations:** Subtle micro-interactions on hover and drag events enhance the application's responsiveness.

To customize the look and feel, edit the CSS variables defined in the `:root` pseudo-class within `index.css`.

## 🔗 Integration with Backend

The frontend communicates with the FastAPI backend via the `/api/simulate` endpoint.
*   **State Management:** The application state (nodes, edges, configurations) is managed via React hooks (`useState`, `useCallback`) and ReactFlow's internal state.
*   **Data Serialization:** When the simulation is triggered, the canvas state is serialized into the JSON payload expected by the backend's Pydantic schemas.
