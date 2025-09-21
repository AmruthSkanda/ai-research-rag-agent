# AI-Powered Publishing Platform

A modern Next.js application designed for publishing companies to leverage AI for enhanced revenue generation and customer service. The platform features dual AI chatbots - one for internal sales and marketing teams, and another for external customers (universities and researchers).

## 🏗️ Architecture Overview

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui component library
- **Typography**: Geist Sans and Geist Mono fonts
- **State Management**: React hooks and context
- **Analytics**: Vercel Analytics integration

### Project Structure
\`\`\`
├── app/
│   ├── layout.tsx          # Root layout with fonts and analytics
│   ├── page.tsx            # Main landing page
│   ├── globals.css         # Global styles and design tokens
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── header.tsx          # Navigation header
│   ├── hero-section.tsx    # Hero section with main CTA
│   ├── chatbot-showcase.tsx # Dual chatbot demonstration
│   ├── chatbot-modal.tsx   # Interactive chatbot interface
│   ├── floating-chat-buttons.tsx # Floating action buttons
│   ├── features-section.tsx # Platform features
│   ├── testimonials-section.tsx # Customer testimonials
│   ├── cta-section.tsx     # Call-to-action section
│   └── footer.tsx          # Site footer
├── hooks/
│   ├── use-mobile.tsx      # Mobile detection hook
│   └── use-toast.ts        # Toast notification hook
├── lib/
│   └── utils.ts            # Utility functions (cn, etc.)
└── public/
    └── images/             # Static assets
\`\`\`

### Design System
- **Color Palette**: Professional red and amber theme
  - Primary: Red (#DC2626) for CTAs and branding
  - Secondary: Amber (#F59E0B) for accents and highlights
  - Neutrals: White, grays, and dark variants
- **Typography**: Geist font family for modern, readable text
- **Layout**: Flexbox-first approach with responsive design
- **Components**: Modular, reusable React components

### Key Features

#### Dual AI Chatbot System
1. **Internal Sales AI**
   - Lead generation and qualification
   - Upselling opportunity identification
   - Sales team productivity enhancement
   - Customer interaction insights

2. **External Research AI**
   - Publication discovery and recommendation
   - Research assistance for universities
   - Academic content navigation
   - Personalized research suggestions

#### Technical Features
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Performance**: Optimized images, lazy loading, efficient bundling
- **SEO**: Proper meta tags, structured data, semantic markup

### Component Architecture

#### Core Components
- **Header**: Navigation with company branding and menu
- **HeroSection**: Main value proposition and primary CTA
- **ChatbotShowcase**: Interactive demonstration of both AI assistants
- **FeaturesSection**: Platform capabilities and benefits
- **TestimonialsSection**: Social proof and customer success stories
- **CTASection**: Secondary conversion opportunities
- **Footer**: Additional navigation and company information

#### Interactive Components
- **ChatbotModal**: Full-featured chat interface with:
  - Right-side panel layout (384px width)
  - Scrollable message history
  - Simulated AI conversations
  - Proper scroll containment
- **FloatingChatButtons**: Persistent access to both chatbots

### Styling Approach
- **Tailwind CSS v4**: Utility-first CSS framework
- **Custom Design Tokens**: Consistent color and spacing system
- **Dark Mode Support**: Complete dark theme implementation
- **Component Variants**: Flexible styling with shadcn/ui patterns

### Development Workflow
1. **Component-First**: Build reusable, modular components
2. **Mobile-First**: Design for mobile, enhance for desktop
3. **Accessibility-First**: Ensure inclusive user experience
4. **Performance-First**: Optimize for speed and efficiency

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

### Deployment
The application is optimized for deployment on Vercel with automatic builds and analytics integration.

## 🎯 Target Audience
- **Primary**: Publishing companies seeking AI-powered revenue enhancement
- **Secondary**: Universities and researchers looking for publication discovery tools
- **Tertiary**: Sales and marketing teams in academic publishing

## 🔧 Customization
The platform is built with modularity in mind. Key customization points:
- Design tokens in `globals.css`
- Component styling via Tailwind classes
- Chatbot conversations in `chatbot-modal.tsx`
- Content and messaging throughout components

## 📈 Future Enhancements
- Real AI integration with OpenAI/Anthropic APIs
- User authentication and personalization
- Analytics dashboard for sales teams
- Advanced publication recommendation algorithms
- Multi-language support for international markets
