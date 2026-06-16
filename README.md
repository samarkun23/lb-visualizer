# LB-Visualizer: Load Balancing Algorithm Visualizer

An interactive, real-time visualization tool designed to help developers and system designers understand the core mechanics of various load balancing algorithms. Built with Next.js, React, and the HTML5 Canvas API.

![Load Balancing Visualization](https://img.shields.io/badge/System%20Design-Interactive%20Visualizer-brightgreen)

## 🚀 Overview

Load balancing is a critical component of modern distributed systems. This project provides a hands-on way to observe how different strategies distribute incoming traffic across a fleet of servers. Watch packets move, monitor server metrics, and compare how algorithms react to different load conditions.

## 🛠 Features

-   **Real-time Traffic Visualization:** Smooth animations using Canvas API to show request flow from client to server.
-   **8 Industrial Algorithms:** Comprehensive implementation of the most common load balancing strategies.
-   **Interactive Controls:**
    -   **Manual Mode:** Send individual requests to see precise step-by-step behavior.
    -   **Auto Run:** Simulate high-traffic environments with adjustable request frequency.
    -   **Dynamic Speed:** Control the animation duration from 150ms to 1200ms.
-   **Live Metrics:** Track connections, hits, bandwidth (kb), and response times (ms) for each server.
-   **Adaptive UI:** Dark-mode optimized interface with visual indicators for active server selection.

## 🧮 Algorithms Implemented

| Algorithm | Logic | Best Use Case |
| :--- | :--- | :--- |
| **Round Robin** | Sequential distribution across all servers. | Stateless APIs, equal-capacity servers. |
| **Least Connections** | Routes to the server with the fewest active requests. | Long-lived connections (WebSockets). |
| **Weighted Round Robin** | Capacity-aware sequential distribution. | Mixed-capacity server fleets. |
| **Weighted Least Conn** | Balances both capacity (weight) and current load. | Variable request durations on mixed hardware. |
| **IP Hash** | Maps client IP to a specific server for persistence. | Session stickiness, stateful applications. |
| **Least Response Time** | Routes to the fastest responding server. | Latency-sensitive APIs, real-time systems. |
| **Random** | Randomized selection for zero-overhead distribution. | Massive scale stateless microservices. |
| **Least Bandwidth** | Routes to the server with the lowest network usage. | Media streaming, large payload transfers. |

## 💻 Tech Stack

-   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Rendering:** HTML5 Canvas API (optimized with React Refs)
-   **Styling:** Modern Vanilla CSS with CSS Variables
-   **Components:** Dynamic imports for client-side heavy visualization

## 🏁 Getting Started

### Prerequisites

-   Node.js 18.x or later
-   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/lb-visualizer.git
    cd lb-visualizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Navigate to `http://localhost:3000` in your browser.

## 🧪 Development

The project is structured for easy extension:
-   `components/algorithms.ts`: Add new strategies by extending the `Algorithm` interface.
-   `components/LBCanvas.tsx`: Modify the visualization logic or styling of the system components.
-   `components/Visualizer.tsx`: Adjust the core simulation state and control panel.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built for learning and exploring the beauty of distributed systems architecture.
