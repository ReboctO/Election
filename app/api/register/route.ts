import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';

export async function POST(request) {
  try {
    const { voterID, voterFname, voterLname, voterMname, password, confirmPassword } = await request.json();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create voter
    await prisma.voter.create({
      data: {
        voterID: parseInt(voterID),
        voterFname,
        voterLname,
        voterMname: voterMname || '',
        voterPass: hashedPassword,
        voterStat: 'Active',
        voted: 'N',
      },
    });

    return NextResponse.json({ message: 'Voter registered successfully' }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}