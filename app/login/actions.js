'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData) {
  const supabase = await createClient()

  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!username) {
    return { error: 'Username is required' }
  }

  if (!password) {
    return { error: 'Password is required' }
  }

  const { data: email, error: lookupError } = await supabase.rpc(
    'get_email_by_username',
    { p_username: username }
  )

  if (lookupError || !email) {
    return { error: 'Invalid username or password' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid username or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim()

  if (!email) {
    return { error: 'Email is required' }
  }

  if (!password) {
    return { error: 'Password is required' }
  }

  if (!username) {
    return { error: 'Username is required for Sign Up' }
  }

  const { data: isAvailable, error: availabilityError } = await supabase.rpc(
    'is_username_available',
    { p_username: username }
  )

  if (availabilityError) {
    console.error('Username availability check failed:', availabilityError)
    // Log the raw response to help debug the DB function
    console.error('isAvailable value was:', isAvailable)
    return { error: 'Could not validate username right now. Please try again.' }
  }

  // Use strict equality: null/undefined from a broken RPC should NOT block signup
  if (isAvailable === false) {
    return { error: 'Username is already taken =(' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  })

  if (error) {
    console.error('Supabase auth.signUp error:', error)

    const normalizedMessage = error.message?.toLowerCase() ?? ''

    // Email already registered — must check before generic 'already' catch
    if (
      normalizedMessage.includes('email') ||
      normalizedMessage.includes('user already registered') ||
      normalizedMessage.includes('already registered')
    ) {
      return { error: 'An account with this email already exists. Try signing in instead.' }
    }

    // Explicit username duplicate from DB constraint
    if (
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('username')
    ) {
      return { error: 'Username is already taken =(' }
    }

    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}