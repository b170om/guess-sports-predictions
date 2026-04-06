const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  console.log('Attempting to sign up admin user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'yuval.avc@gmail.com',
    password: 'fcbar2001!',
    options: {
      data: {
        username: 'b170om',
      }
    }
  });

  if (error) {
    console.error('Error signing up admin:', error.message);
  } else {
    console.log('Auth user created successfully:', data.user?.id);
  }
}

seed();
