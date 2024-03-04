import { createUser, deleteUser, getAllUsers, getUser, updateUser } from "@/prisma/user";
import { NextRequest } from "next/server";

// create user
export async function POST(request: NextRequest) {
    const {email,name} = await request.json()    
    
    const user = await createUser(email, name)
    return Response.json(user)
}

// get all users 
// export async function GET(request: NextRequest) {
//    const users = await getAllUsers()
//    return Response.json(users)
// }

//get single user
export async function GET(request: NextRequest) {
   const { searchParams } = new URL(request.url)
   const id = searchParams.get('id')

   if (id) {
    const user = await getUser(id)
    return Response.json(user)
   } else {
    throw new Error('You do not provide the id of the user')
   }
}

// update user
export async function PUT(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const {email,name} = await request.json()    

    if (id) {
        const user = await updateUser(id,name, email)
        return Response.json(user)
    }
    else {
        throw new Error('You do not provide the id of the user')
    }
}

//delete user
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (id) {
     const user = await deleteUser(id)
     return Response.json(user)
    } else {
     throw new Error('You do not provide the id of the user')
    }
 }