import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const GET = async (request: NextRequest) => {
  try {
    const userId = request.nextUrl.pathname.split("/").pop();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const userId = request.nextUrl.pathname.split("/").pop();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { name, email, password: hashedPassword, role },
    });

    return NextResponse.json(
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const userId = request.nextUrl.pathname.split("/").pop();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
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
