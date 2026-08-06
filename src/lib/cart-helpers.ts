import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Cart } from "@prisma/client";

export async function getCartForUser(userId: string): Promise<Cart | null> {
  const cookieStore = await cookies();
  const sessionCartId = cookieStore.get("sessionCartId")?.value;

  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart && sessionCartId) {
    cart = await prisma.cart.findFirst({
      where: { sessionCartId },
    });

    if (cart) {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { userId },
      });
    }
  }

  return cart;
}
