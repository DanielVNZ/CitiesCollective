import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsernameOrEmail, createPasswordResetToken } from 'app/db';
import { sendPasswordResetEmail } from 'app/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email or username
    const users = await getUserByUsernameOrEmail(email);
    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    const user = users[0];

    // Create password reset token
    const resetToken = await createPasswordResetToken(user.id);

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      user.email!,
      resetToken.token,
      user.username || user.email!.split('@')[0]
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json({ 
        error: 'Failed to send password reset email. Please try again later.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json({ 
      error: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 