import { NextRequest, NextResponse } from 'next/server';
import { getPasswordResetToken, deletePasswordResetToken, updateUserPassword } from 'app/db';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Get and validate reset token
    const resetToken = await getPasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Update user's password
    await updateUserPassword(resetToken.userId, password);

    // Delete the used token
    await deletePasswordResetToken(token);

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json({ 
      error: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 