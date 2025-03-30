# React CRM System v4

A modern Customer Relationship Management (CRM) system built with React, Next.js, and Supabase.

## Features

- **Dashboard**: View business metrics, revenue charts, client growth and upcoming tasks
- **Client Management**: Add, edit, view, and delete client records
- **Data Visualization**: Charts showing revenue trends and client growth
- **Authentication**: User roles (Admin, Boss, Employee) with appropriate permissions and secure login
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: React 19, Next.js 15
- **UI Components**: Shadcn UI, Radix UI, Lucide React icons
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with secure session management
- **Charts**: Recharts
- **Notifications**: Toast notifications

## Prerequisites

- Node.js 18 or higher
- npm or pnpm package manager
- Supabase account and project

## Setup and Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/react-crm.git
cd react-crm
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Structure

The application uses a Supabase backend with the following tables:

- **clients**: Stores client information including contact details, case numbers, and document status
- **users**: Manages user authentication and role-based permissions

## Authentication

The application implements a secure authentication system using Supabase Auth:

- **Login Screen**: A secure login interface for users to authenticate
- **Protected Routes**: All application routes are protected and require authentication
- **Role-Based Access**: Different functionality based on user roles (Admin, Boss, Employee)
- **Profile Management**: View and edit user profile information
- **Secure Logout**: Ability to securely end the session

## Usage

### Dashboard

The dashboard provides an overview of key business metrics:
- Total revenue
- Active clients
- Pending invoices
- Active projects
- Revenue charts
- Client growth statistics
- Recent activities and upcoming tasks

### Clients Management

The clients page allows you to:
- View all clients in a sortable and filterable table
- Search for clients by name, email, case number, or phone
- Filter clients by status
- Add new clients via a modal form
- View detailed client information
- Update client details
- Delete client records

## Deployment

This application can be deployed on Vercel, Netlify, or any other platform that supports Next.js applications.

```bash
npm run build
# or
pnpm build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

