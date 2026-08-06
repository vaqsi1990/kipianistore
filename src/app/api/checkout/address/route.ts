import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'idNumber', 'streetAddress', 'city', 'postalCode'];
    for (const field of requiredFields) {
      if (!address[field] || !address[field].trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate phone number format
    const phoneRegex = /^(\+995|995)?[0-9]{9}$/;
    if (!phoneRegex.test(address.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate ID number format
    const idNumberRegex = /^[0-9]{11}$/;
    if (!idNumberRegex.test(address.idNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid ID number format' },
        { status: 400 }
      );
    }

    // Store address in session (you might want to use a more secure storage method)
    // For now, we'll return a success response with the validated address
    return NextResponse.json({
      success: true,
      address: {
        firstName: address.firstName.trim(),
        lastName: address.lastName.trim(),
        phone: address.phone.trim(),
        email: address.email.trim(),
        idNumber: address.idNumber.trim(),
        streetAddress: address.streetAddress.trim(),
        city: address.city.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country || 'Georgia',
        additionalInfo: address.additionalInfo || '',
      }
    });

  } catch (error) {
    console.error('Error processing checkout address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 