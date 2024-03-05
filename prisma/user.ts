import { PrismaClient, Prisma, Post } from '@prisma/client'

const prisma = new PrismaClient()


export const createUser = async (email: string,name: string,
    posts : Post[]
    ) => {
        
    const user = await prisma.user.create({
        data :{
            email,
            name,
            posts : {
                create:
                    // title: 'My first post',
                    // body: 'Lots of really interesting stuff',
                    // slug: 'my-first-post',
                    posts
            }
        }
    })
    return user;
}


export const getAllUsers = async () => {

    const users = await prisma.user.findMany(
    // {
    //     orderBy:[{'name':'desc'}]
    // }
    )
    return users
}

export const deleteUser = async (id:string) => {
    await prisma.user.delete({
        where: {id:id}
    })
    return "User deleted successfully"
}

export const updateUser = async (id:string, name:string,email:string) => {
    const user = await prisma.user.update({
        where: {id:id},
        data:{
            name,
            email,
        }
    })
    return user;
}
export const getUser = async (id:string) => {
    const user = await prisma.user.findUnique({
        where: {id:id},
    })
    return user;
}