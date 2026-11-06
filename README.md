# Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/ChrisHill415/NewHorizonsAuction.git
cd NewHorizonsAuction
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Located in Supabase when you go to project and click connect in top left.


### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Before starting work

Update your local `main` branch:

```bash
git checkout main
git pull origin main
```

Then create a new branch:

```bash
git checkout -b feature/your-feature-name
```
