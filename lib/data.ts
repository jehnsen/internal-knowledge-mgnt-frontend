import { Article, Category } from "./types";

export const categories: Category[] = [
  {
    id: "1",
    name: "Engineering",
    description: "Technical documentation and best practices",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Product",
    description: "Product specifications and roadmaps",
    color: "bg-purple-500",
  },
  {
    id: "3",
    name: "Design",
    description: "Design guidelines and UI/UX resources",
    color: "bg-pink-500",
  },
  {
    id: "4",
    name: "Operations",
    description: "Operational procedures and workflows",
    color: "bg-green-500",
  },
  {
    id: "5",
    name: "HR",
    description: "Human resources policies and guidelines",
    color: "bg-orange-500",
  },
];

export const articles: Article[] = [
  {
    id: "1",
    title: "Getting Started with React Hooks",
    content: `# Getting Started with React Hooks

React Hooks are a powerful feature that allows you to use state and other React features in functional components.

## What are Hooks?

Hooks are functions that let you "hook into" React state and lifecycle features from function components. They don't work inside classes.

## Most Common Hooks

### useState
The useState hook lets you add state to functional components:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

### useEffect
The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Best Practices

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Use the ESLint plugin to enforce these rules
4. Keep your hooks focused and composable

## Conclusion

React Hooks provide a more direct API to the React concepts you already know. They enable better code reuse and organization.`,
    summary: "A comprehensive guide to understanding and using React Hooks in your applications.",
    category: "Engineering",
    tags: ["React", "JavaScript", "Frontend", "Hooks"],
    author: "Sarah Chen",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    views: 1247,
  },
  {
    id: "2",
    title: "API Design Best Practices",
    content: `# API Design Best Practices

Designing great APIs requires careful consideration of many factors. This guide covers essential principles.

## RESTful Principles

1. **Use HTTP Methods Correctly**
   - GET for retrieval
   - POST for creation
   - PUT/PATCH for updates
   - DELETE for removal

2. **Resource Naming**
   - Use nouns, not verbs
   - Use plural forms: /users, /articles
   - Be consistent

## Versioning

Always version your API to prevent breaking changes:
- URL versioning: /v1/users
- Header versioning: Accept: application/vnd.company.v1+json

## Error Handling

Return meaningful HTTP status codes:
- 200 OK - Success
- 201 Created - Resource created
- 400 Bad Request - Invalid input
- 401 Unauthorized - Authentication required
- 404 Not Found - Resource doesn't exist
- 500 Internal Server Error - Server error

## Documentation

Always provide clear, comprehensive documentation with:
- Endpoint descriptions
- Request/response examples
- Authentication requirements
- Rate limiting information`,
    summary: "Essential principles and patterns for designing robust and maintainable REST APIs.",
    category: "Engineering",
    tags: ["API", "REST", "Backend", "Best Practices"],
    author: "Michael Rodriguez",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    views: 892,
  },
  {
    id: "3",
    title: "Product Roadmap Planning Guide",
    content: `# Product Roadmap Planning Guide

Creating effective product roadmaps requires balancing stakeholder needs, technical constraints, and business goals.

## Key Components

### Vision and Strategy
Start with a clear vision of where your product is heading and why.

### Goals and Objectives
Define measurable outcomes:
- User acquisition targets
- Feature adoption rates
- Revenue goals
- Customer satisfaction metrics

### Timeline
Break down initiatives into quarters:
- Q1: Foundation features
- Q2: Growth initiatives
- Q3: Optimization
- Q4: Innovation

## Stakeholder Management

1. **Regular Communication**
   - Weekly updates to leadership
   - Monthly presentations to broader team
   - Quarterly strategic reviews

2. **Feedback Loops**
   - User research sessions
   - Customer advisory boards
   - Internal feedback channels

## Prioritization Framework

Use the RICE framework:
- **Reach**: How many users will this impact?
- **Impact**: How much will it impact users?
- **Confidence**: How confident are we?
- **Effort**: How much time will it take?

Score = (Reach × Impact × Confidence) / Effort`,
    summary: "A framework for creating and maintaining effective product roadmaps that align teams and drive results.",
    category: "Product",
    tags: ["Product Management", "Planning", "Strategy"],
    author: "Emily Watson",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-19"),
    views: 634,
  },
  {
    id: "4",
    title: "Design System Principles",
    content: `# Design System Principles

A design system is a collection of reusable components, guided by clear standards, that can be assembled to build applications.

## Core Principles

### Consistency
Maintain visual and functional consistency across all products:
- Use the same color palette
- Apply consistent spacing rules
- Follow typography guidelines

### Accessibility
Design for everyone:
- WCAG 2.1 AA compliance minimum
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements

### Modularity
Build components that can be combined:
- Atomic design methodology
- Composable patterns
- Clear component hierarchies

## Components

### Atoms
Basic building blocks:
- Buttons
- Inputs
- Labels
- Icons

### Molecules
Simple component combinations:
- Form fields (label + input)
- Search bars
- Card headers

### Organisms
Complex component combinations:
- Navigation bars
- Forms
- Cards
- Modals

## Documentation

Every component should have:
- Usage guidelines
- Props/API documentation
- Code examples
- Do's and don'ts
- Accessibility notes`,
    summary: "Principles and practices for building scalable, accessible design systems.",
    category: "Design",
    tags: ["Design System", "UI/UX", "Components", "Accessibility"],
    author: "Alex Kim",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-21"),
    views: 1089,
  },
  {
    id: "5",
    title: "Incident Response Procedures",
    content: `# Incident Response Procedures

Quick and effective incident response is critical for maintaining system reliability and customer trust.

## Severity Levels

### P0 - Critical
- Complete service outage
- Data breach or security incident
- Response time: Immediate
- All hands on deck

### P1 - High
- Major feature unavailable
- Significant performance degradation
- Response time: < 1 hour
- Primary on-call + backup

### P2 - Medium
- Minor feature issues
- Moderate performance impact
- Response time: < 4 hours
- Primary on-call

### P3 - Low
- Cosmetic issues
- Minimal user impact
- Response time: Next business day

## Response Process

1. **Detection & Alert**
   - Monitoring systems trigger alerts
   - User reports escalated
   - Team member identifies issue

2. **Initial Response**
   - Acknowledge the incident
   - Assess severity
   - Page appropriate team members

3. **Investigation**
   - Gather logs and metrics
   - Identify root cause
   - Document findings in real-time

4. **Mitigation**
   - Implement immediate fix or workaround
   - Monitor for stability
   - Communicate with stakeholders

5. **Resolution**
   - Verify issue is resolved
   - Update status page
   - Notify affected users

6. **Post-Mortem**
   - Document timeline
   - Identify root cause
   - List action items
   - Share learnings

## Communication

- Use dedicated incident channel
- Regular status updates (every 30 min for P0/P1)
- Clear, concise language
- Update status page`,
    summary: "Standard operating procedures for detecting, responding to, and resolving production incidents.",
    category: "Operations",
    tags: ["Incident Response", "DevOps", "SRE", "Monitoring"],
    author: "David Park",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-15"),
    views: 756,
  },
  {
    id: "6",
    title: "Remote Work Policy",
    content: `# Remote Work Policy

Our remote work policy is designed to support flexibility while maintaining productivity and team cohesion.

## Eligibility

All full-time employees are eligible for remote work with manager approval.

## Work Arrangements

### Fully Remote
- Work from anywhere within your country
- Required equipment provided
- Home office stipend: $500/year
- Co-working space reimbursement available

### Hybrid
- 2-3 days in office per week
- Team determines core collaboration days
- Flexible schedule within core hours

### Core Hours
- 10 AM - 3 PM local time
- Available for meetings and collaboration
- Flexible hours outside core time

## Communication Expectations

### Response Times
- Urgent messages: 1 hour
- Regular messages: 4 hours
- Emails: 24 hours

### Meetings
- Default to video on
- Use calendar for availability
- Record when possible for async viewing

## Equipment & Security

### Provided Equipment
- Laptop
- Monitor
- Keyboard and mouse
- Headset

### Security Requirements
- Use VPN for company resources
- Enable 2FA on all accounts
- Lock screen when away
- Never share credentials

## Performance & Accountability

Success measured by:
- Output and results
- Meeting deadlines
- Team collaboration
- Quality of work

Not measured by:
- Hours logged
- Time of day working
- Physical presence

## Well-being

Encouraged practices:
- Take regular breaks
- Use PTO
- Set boundaries
- Maintain work-life balance
- Communicate challenges early`,
    summary: "Guidelines and expectations for remote and hybrid work arrangements.",
    category: "HR",
    tags: ["Remote Work", "Policy", "HR", "Work Culture"],
    author: "Jennifer Martinez",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-17"),
    views: 2103,
  },
];
