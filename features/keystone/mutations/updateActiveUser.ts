async function updateActiveUser(root: any, { data }: { data: any }, context: any) {
  const sudoContext = context.sudo();

  // Check if user is authenticated
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("Not authenticated");
  }

  // Get current user
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId }
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  // Update user
  return await sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data,
  });
}

export default updateActiveUser;
