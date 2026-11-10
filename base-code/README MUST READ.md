STEPS TO CREATE THE CODE

1. Create react vite project
    > npm create vite@latest my-app
2. Go to the code path and install dependencies
    > cd my-app
    > npm install
3. Install tailwindcss v3.4.17
    > npm install -D tailwindcss@3 postcss autoprefixer
    > npx tailwindcss init -p
4. Run build
    > npm run dev
5. Apply your tailwind css to the className in jsx files

Tip: You may need to install additional dependencies like react-router-dom, supabase API, etc.
    > npm install react-router-dom
    > npm install @supabase/supabase-js