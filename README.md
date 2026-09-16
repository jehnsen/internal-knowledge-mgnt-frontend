# Internal Knowledge Management System

A modern, AI-powered internal knowledge management system built with Next.js, TypeScript, and Tailwind CSS. Features RAG (Retrieval-Augmented Generation) capabilities for intelligent document search with source citations.

![Knowledge Management System](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## Features

### 🤖 AI-Powered Knowledge Base
- **RAG Integration**: Connect to your RAG backend for intelligent document search
- **Citation Support**: Every AI response includes source citations with document names, page numbers, and relevance scores
- **Conversational Interface**: Chat-based interface for natural language queries
- **Real-time Responses**: Stream responses from your knowledge base

### 📄 Document Management
- **Drag-and-Drop Upload**: Easy document upload with visual feedback
- **Multiple Format Support**: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
- **Processing Status**: Track document indexing status in real-time
- **Document Library**: Manage all uploaded documents in one place

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Clean Interface**: Professional design with smooth animations
- **Dark Mode Ready**: Full dark mode support
- **Accessible**: WCAG compliant components

### 📚 Traditional Knowledge Base
- **Article Management**: Create, view, and organize knowledge articles
- **Category System**: Organize content by categories
- **Tag System**: Tag articles for better discoverability
- **Search Functionality**: Real-time search across all content

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- RAG backend API (optional, for AI features)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Project Structure

```
internal-knowledge-mgnt/
├── app/                          # Next.js app directory
│   ├── knowledge/               # AI Assistant page
│   ├── articles/                # Article pages
│   │   ├── [id]/               # Dynamic article detail
│   │   └── new/                # Create article
│   ├── categories/             # Category pages
│   │   └── [category]/         # Category detail
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                  # React components
│   ├── ui/                     # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── skeleton.tsx
│   ├── ChatInterface.tsx       # AI chat interface
│   ├── CitationCard.tsx        # Citation display
│   ├── DocumentUpload.tsx      # File upload component
│   ├── DocumentList.tsx        # Document management
│   ├── ArticleCard.tsx         # Article preview card
│   ├── Navigation.tsx          # Main navigation
│   └── SearchBar.tsx           # Search component
└── lib/                        # Utilities and services
    ├── api.ts                  # API service layer
    ├── types.ts                # TypeScript types
    ├── data.ts                 # Sample data
    └── utils.ts                # Utility functions
```

## Key Components

### AI Assistant (`/knowledge`)

The main RAG interface with three tabs:

1. **Ask Questions**: Chat interface with AI responses and citations
2. **Upload Documents**: Drag-and-drop document upload
3. **Document Library**: Manage uploaded documents

### Citation Display

Citations include:
- Document name
- Page number (if available)
- Relevant excerpt from the source
- Relevance score (0-100%)
- Link to view full document

### Document Upload

Features:
- Drag-and-drop interface
- Multiple file upload
- Progress tracking
- File type validation
- Visual status indicators

## API Integration

### Backend Requirements

Your RAG backend should implement these endpoints:

```typescript
// Upload document
POST /api/documents/upload
Content-Type: multipart/form-data

// Query knowledge base
POST /api/query
{
  "query": string,
  "conversationId"?: string,
  "filters"?: {
    "documentIds"?: string[],
    "dateRange"?: { start: Date, end: Date }
  }
}

// Get documents
GET /api/documents

// Delete document
DELETE /api/documents/:id
```

### Response Format

Query responses should include:

```typescript
{
  "answer": string,
  "citations": [
    {
      "documentId": string,
      "documentName": string,
      "pageNumber"?: number,
      "chunkId": string,
      "content": string,
      "relevanceScore": number
    }
  ],
  "conversationId": string,
  "timestamp": Date
}
```

## Customization

### Adding Categories

Edit `lib/data.ts`:

```typescript
export const categories: Category[] = [
  {
    id: "your-id",
    name: "Your Category",
    description: "Description here",
    color: "bg-blue-500", // Tailwind color
  },
];
```

### Styling

- Colors: Edit Tailwind theme in `tailwind.config.ts`
- Components: Modify components in `components/ui/`
- Global styles: Edit `app/globals.css`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Chat Interface

- Natural language queries
- Streaming responses
- Conversation history
- Citation expandability
- Relevance scoring
- Source highlighting

### Document Management

- Upload tracking
- Processing status
- File metadata
- Batch operations
- Search and filter
- Quick actions

### Search & Discovery

- Real-time search
- Category filtering
- Tag-based discovery
- Relevance ranking
- Result highlighting

## Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy to Vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-ga-id
```

## Performance

- Server-side rendering for SEO
- Static generation where possible
- Lazy loading for images and components
- Optimized bundle size
- Efficient caching strategy

## Security

- Input sanitization
- CORS configuration
- Rate limiting (backend)
- File type validation
- Secure file uploads

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced filters (date range, file type)
- [ ] Document versioning
- [ ] Collaborative editing
- [ ] Analytics dashboard
- [ ] Export functionality
- [ ] Bookmarks and favorites
- [ ] User permissions

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support