# Flow Wise - Client 

## Descrizione
Frontend part of Flow-Wise project - Money tracker.
Created with React + Next.js

## Tech

- **Next.js** 
- **Tailwind CSS** 
- **Sonner** 
- **ShadCN/UI** 

## Structure

```
flow-wise-client/
├── app/
			└── dashboard/
			└── login/
			└── register/
├── components/
			└── ui/
├── lib/
├── utils/
├── public/
└── styles/
```

## Env config

Create a `.env.local` in the project root, in which at least you should have this:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/
```

## Deployment

Deployed using Vercel at https://flow-wise-client.vercel.app/