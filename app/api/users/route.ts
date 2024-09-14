import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const GET = async (request: NextRequest) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { name, email, password, role = "USER" } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use!" },
        { status: 400 }
      );
    }

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
};

function handleError(error: unknown) {
  console.error(error);
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}
