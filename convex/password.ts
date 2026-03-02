"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const updatePassword = internalAction({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🔐 Hashing with lucia Scrypt format...");

    const { scrypt } = await import("@noble/hashes/scrypt.js");
    const { utf8ToBytes, bytesToHex, randomBytes } =
      await import("@noble/hashes/utils.js");

    // ✅ نفس lucia بالظبط
    const saltBytes = randomBytes(16);
    const saltHex = bytesToHex(saltBytes);

    const normalizedPassword = args.newPassword.normalize("NFKC");
    const encodedData = utf8ToBytes(normalizedPassword);
    const encodedSalt = utf8ToBytes(saltHex); // lucia بتعمل encode للـ salt كـ UTF8 text

    const key = scrypt(encodedData, encodedSalt, {
      N: 16384,
      r: 16, // ✅ lucia بتستخدم r=16
      p: 1,
      dkLen: 64,
    });

    const hashHex = bytesToHex(key);

    // ✅ lucia format: "saltHex:hashHex"
    const hashedPassword = `${saltHex}:${hashHex}`;

    console.log("🔑 Parts:", hashedPassword.split(":").length); // لازم 2
    console.log("🔑 saltHex length:", saltHex.length); // لازم 32
    console.log("🔑 hashHex length:", hashHex.length); // لازم 128

    await ctx.runMutation(internal.passwordMutations.patchAccountSecret, {
      userId: args.userId,
      hashedPassword,
    });

    console.log("✅ Done");
    return { success: true };
  },
});
