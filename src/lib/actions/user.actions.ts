'use server';

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,

} from '../validators';
import { auth, signIn, signOut } from '../../../auth';
import { hash } from "../encrypt"
import { prisma } from '../prisma';
import { formatError } from '../utils';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getMyCart } from './cart.actions';
import { generateVerificationToken } from '../token';
import { sendVerificationEmail } from '../email';


export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', user);

    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    if (error)
    {console.log(error);
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

export async function signUpUser(prevState: any, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    // Check if user already exists before creating
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (existingUser) {
      return { 
        success: false, 
        message: 'Email already exists. Please use a different email or sign in with your existing account.' 
      };
    }

    const hashedPassword = await hash(user.password);

    // Create user without email verification
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    // Generate verification token
    const verificationToken = await generateVerificationToken(user.email);

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationToken.token);

    if (!emailResult.success) {
      // If email fails, delete the user and return error
      await prisma.user.delete({
        where: { email: user.email }
      });
      return { 
        success: false, 
        message: emailResult.error || 'Failed to send verification email. Please try again.' 
      };
    }

    return {
      success: true,
      email: user.email,
      message: 'Account created successfully. Please check your email to verify your account.',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
// Sign user out
export async function signOutUser() {
  // get current users cart and delete it so it does not persist to next user
  const currentCart = await getMyCart();

  if (currentCart?.id) {
    await prisma.cart.delete({ where: { id: currentCart.id } });
  } else {
    console.warn('No cart found for deletion.');
  }
  await signOut();
}

// Sign up user

