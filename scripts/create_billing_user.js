const crypto = require('crypto');
const dbManager = require('../core/db/db_manager.js');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node create_billing_user.js <username> <initial_balance>");
    console.error("Example: node create_billing_user.js CustomerCorp 1000");
    process.exit(1);
  }

  const username = args[0];
  const initialBalance = parseFloat(args[1]);

  if (isNaN(initialBalance) || initialBalance < 0) {
    console.error("Error: initial_balance must be a positive number.");
    process.exit(1);
  }

  // Generate unique ID and secure API Key
  const userId = crypto.randomUUID();
  const rawToken = crypto.randomBytes(24).toString('hex');
  const apiKey = `sk-ant-${rawToken}`;

  const user = {
    id: userId,
    username: username,
    apikey: apiKey,
    role: 'Developer',
    allowed_tools: ['TaskCreate', 'TaskOutput', 'FileRead', 'ListMcpResources'] // Sample default tools
  };

  try {
    // 1. Ensure DB is initialized and migrations run
    await dbManager.init();

    // 2. Create the user
    await dbManager.addOrUpdateUser(user);

    // 3. Set initial wallet balance
    await dbManager.setWalletBalance(userId, initialBalance, 'CREDITS');

    console.error("\n=======================================================");
    console.error(" 🎉 Billing User Created Successfully!");
    console.error("=======================================================");
    console.error(` Username:     ${user.username}`);
    console.error(` User ID:      ${user.id}`);
    console.error(` API Key:      ${user.apikey}`);
    console.error(` Role:         ${user.role}`);
    console.error(` Balance:      ${initialBalance} CREDITS`);
    console.error("=======================================================\n");
    console.error(" Keep the API Key secure. The client can check their balance at:");
    console.error(` GET /wallet?apikey=${user.apikey}`);
    
  } catch (err) {
    console.error("\n[ERROR] Failed to create user:", err.message);
  }
}

main();
