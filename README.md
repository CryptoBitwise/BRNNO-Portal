# BRNNO - Premium Auto Detailing Platform

A modern React application for connecting users with certified auto detailing professionals. Built with React, Vite, and Tailwind CSS.

## Features

- 🚗 **Vehicle Type Filtering** - Filter detailers by vehicle type (Car, Truck, SUV, RV, Motorcycle, Commercial)
- 📍 **Location Search** - Find detailers near your location
- ⭐ **Certified Professionals** - Only certified detailers available for booking
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔐 **User Authentication** - Sign in/out functionality with user menu
- 📅 **Booking Management** - View and manage your bookings
- 💳 **Subscription Plans** - Multiple subscription tiers available
- ⚙️ **Settings** - Customize notifications and preferences

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd brnno-auto-detailing
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
brnno-auto-detailing/
├── public/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles and Tailwind imports
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
```

## Features Overview

### Home Page

- Hero section with search functionality
- Vehicle type filtering
- Map placeholder (ready for Google Maps integration)
- Detailer cards with ratings, reviews, and booking options

### User Authentication

- Sign in/out functionality
- User menu with profile, bookings, subscription, and settings
- Conditional rendering based on authentication state

### Profile Management

- User profile information
- Editable contact details
- Save functionality

### Booking System

- View current bookings
- Empty state with call-to-action
- Integration ready for booking flow

### Subscription Plans

- Three-tier pricing structure (Basic, Pro, Premium)
- Feature comparison
- Plan selection interface

### Settings

- Notification preferences
- User preferences management

## Customization

### Styling

The application uses Tailwind CSS for styling. You can customize the design by:

- Modifying `tailwind.config.js` for theme customization
- Updating `src/index.css` for global styles
- Using Tailwind utility classes in components

### Data

Mock data is currently used for detailers. To integrate with a real API:

- Replace the `mockDetailers` array with API calls
- Update the filtering logic to work with dynamic data
- Add loading states and error handling

### Maps Integration

The map placeholder is ready for Google Maps integration:

- Add Google Maps API key
- Replace the placeholder with actual map component
- Implement location-based filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the BRNNO team.
